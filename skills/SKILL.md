---
name: image-crossfade-video
description: Generate crossfade transition videos from a sequence of images using sharp and ffmpeg
version: 0.1.0
---

# Image Crossfade Video Generator Skill

Use this skill when the user wants to create a video from a sequence of images with smooth crossfade transitions.

## When to use
- User wants to make a slideshow video from images
- User needs crossfade transitions between images
- User mentions "image to video", "slideshow", or "crossfade"

## How to use

```javascript
import { createCrossfadeVideo } from 'image-crossfade-video';

await createCrossfadeVideo({
  images: ['img1.png', 'img2.png', 'img3.png'],
  output: 'output.mp4',
  displayDuration: 3,    // seconds each image is shown
  transitionDuration: 1, // seconds for crossfade
  fps: 30,
  width: 1920,
  height: 1080
});
```

## Prerequisites
- ffmpeg must be installed and available in PATH
- sharp npm package (installed as dependency)

## Key behaviors
- Uses sharp for image compositing (alpha blending for crossfades)
- Pipes frames to ffmpeg for video encoding
- Configurable display time, transition time, FPS, and resolution
- Supports PNG, JPEG, and WebP input images
- Auto-resizes images to target resolution with cover fit
