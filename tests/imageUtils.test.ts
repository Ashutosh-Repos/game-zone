import { describe, it, expect, vi } from 'vitest';
import { compressImage } from '../src/lib/imageUtils';

describe('Image Compression Utility', () => {
  it('should compress and resize image canvas', async () => {
    // Mock HTMLCanvasElement 2D context for headless DOM environment
    const mockContext = {
      drawImage: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockContext as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => 'data:image/jpeg;base64,mockcompresseddata');

    const rawDataUrl = 'data:image/png;base64,mockrawdata';
    const compressed = await compressImage(rawDataUrl);

    expect(compressed).toBeDefined();
    expect(compressed.startsWith('data:image/jpeg')).toBe(true);
  });
});
