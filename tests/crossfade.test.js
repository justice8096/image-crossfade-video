import { describe, it, expect } from 'vitest';
import { calculateFrameCount } from '../src/index.js';

describe('calculateFrameCount', () => {
  it('returns 0 frames for 0 images', () => {
    const result = calculateFrameCount(0, 3, 1, 30);
    expect(result.totalFrames).toBe(0);
  });

  it('returns display frames only for 1 image', () => {
    const result = calculateFrameCount(1, 3, 1, 30);
    expect(result.totalFrames).toBe(90); // 3 * 30
    expect(result.displayFrames).toBe(90);
  });

  it('calculates correctly for 2 images', () => {
    const result = calculateFrameCount(2, 3, 1, 30);
    // 2 * 90 display + 1 * 30 transition = 210
    expect(result.totalFrames).toBe(210);
  });

  it('calculates correctly for 5 images', () => {
    const result = calculateFrameCount(5, 2, 0.5, 24);
    const display = Math.round(2 * 24); // 48
    const transition = Math.round(0.5 * 24); // 12
    expect(result.totalFrames).toBe(5 * 48 + 4 * 12); // 288
  });

  it('handles fractional durations', () => {
    const result = calculateFrameCount(3, 1.5, 0.5, 30);
    expect(result.displayFrames).toBe(45);
    expect(result.transitionFrames).toBe(15);
    expect(result.totalFrames).toBe(3 * 45 + 2 * 15); // 165
  });
});
