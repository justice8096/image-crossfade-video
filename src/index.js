/**
 * Image Crossfade Video Generator
 * Creates videos from image sequences with smooth crossfade transitions.
 */
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Blend two images with alpha crossfade.
 * @param {Buffer} imgA - First image buffer
 * @param {Buffer} imgB - Second image buffer
 * @param {number} alpha - Blend factor (0=A, 1=B)
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @returns {Promise<Buffer>} Blended image as raw RGB buffer
 */
export async function blendImages(imgA, imgB, alpha, width, height) {
  const a = await sharp(imgA).resize(width, height, { fit: 'cover' }).raw().toBuffer();
  const b = await sharp(imgB).resize(width, height, { fit: 'cover' }).raw().toBuffer();

  const result = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = Math.round(a[i] * (1 - alpha) + b[i] * alpha);
  }
  return result;
}

/**
 * Load and resize an image to target dimensions.
 * @param {string} imagePath - Path to image file
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<Buffer>} Raw RGB buffer
 */
export async function loadImage(imagePath, width, height) {
  return sharp(imagePath)
    .resize(width, height, { fit: 'cover' })
    .raw()
    .toBuffer();
}

/**
 * Calculate total frame count for the video.
 * @param {number} imageCount - Number of images
 * @param {number} displayDuration - Seconds each image is shown
 * @param {number} transitionDuration - Seconds for crossfade
 * @param {number} fps - Frames per second
 * @returns {{ totalFrames: number, displayFrames: number, transitionFrames: number }}
 */
export function calculateFrameCount(imageCount, displayDuration, transitionDuration, fps) {
  const displayFrames = Math.round(displayDuration * fps);
  const transitionFrames = Math.round(transitionDuration * fps);

  if (imageCount <= 0) return { totalFrames: 0, displayFrames, transitionFrames };
  if (imageCount === 1) return { totalFrames: displayFrames, displayFrames, transitionFrames };

  const totalFrames = imageCount * displayFrames + (imageCount - 1) * transitionFrames;
  return { totalFrames, displayFrames, transitionFrames };
}

/**
 * Generate a crossfade video from a sequence of images.
 * @param {object} opts
 * @param {string[]} opts.images - Array of image file paths
 * @param {string} opts.output - Output video file path
 * @param {number} [opts.displayDuration=3] - Seconds each image is shown
 * @param {number} [opts.transitionDuration=1] - Seconds for crossfade
 * @param {number} [opts.fps=30] - Frames per second
 * @param {number} [opts.width=1920] - Video width
 * @param {number} [opts.height=1080] - Video height
 * @param {function} [opts.onProgress] - Progress callback (frameIndex, totalFrames)
 * @returns {Promise<void>}
 */
export async function createCrossfadeVideo(opts) {
  const {
    images,
    output,
    displayDuration = 3,
    transitionDuration = 1,
    fps = 30,
    width = 1920,
    height = 1080,
    onProgress
  } = opts;

  if (!images || images.length === 0) {
    throw new Error('At least one image is required');
  }

  for (const img of images) {
    if (!fs.existsSync(img)) {
      throw new Error(`Image not found: ${img}`);
    }
  }

  const { totalFrames, displayFrames, transitionFrames } = calculateFrameCount(
    images.length, displayDuration, transitionDuration, fps
  );

  // Spawn ffmpeg
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-s', `${width}x${height}`,
    '-r', String(fps),
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    output
  ]);

  let frameIndex = 0;

  // Pre-load all images
  const buffers = await Promise.all(
    images.map(img => loadImage(img, width, height))
  );

  for (let i = 0; i < images.length; i++) {
    // Display frames
    for (let f = 0; f < displayFrames; f++) {
      ffmpeg.stdin.write(buffers[i]);
      if (onProgress) onProgress(frameIndex++, totalFrames);
    }

    // Transition frames
    if (i < images.length - 1) {
      for (let f = 0; f < transitionFrames; f++) {
        const alpha = (f + 1) / (transitionFrames + 1);
        const blended = await blendImages(
          images[i], images[i + 1], alpha, width, height
        );
        ffmpeg.stdin.write(blended);
        if (onProgress) onProgress(frameIndex++, totalFrames);
      }
    }
  }

  // Finalize
  return new Promise((resolve, reject) => {
    ffmpeg.stdin.end();
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    ffmpeg.on('error', reject);
  });
}

export default { createCrossfadeVideo, blendImages, loadImage, calculateFrameCount };
