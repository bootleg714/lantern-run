// Load the original Free Knight sprite sheets once and crop each 120 x 80 frame
// around a shared feet anchor. The game reuses these pixels without per-frame scaling.
export async function loadFreeKnight(sheets) {
  const result = {};
  await Promise.all(Object.entries(sheets).map(async ([name, uri]) => {
    const img = new Image(); img.src = uri;
    await img.decode();
    if (img.height !== 80 || img.width % 120) throw new Error('Invalid Free Knight sheet: ' + name);
    const canvas = document.createElement('canvas'); canvas.width = 90; canvas.height = 44;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const frames = [];
    for (let i = 0; i < img.width / 120; i++) {
      ctx.clearRect(0, 0, 90, 44);
      ctx.drawImage(img, i * 120 + 20, 36, 90, 44, 0, 0, 90, 44);
      const px = ctx.getImageData(0, 0, 90, 44).data;
      const c = new Uint32Array(90 * 44);
      for (let j = 0; j < c.length; j++) c[j] = px[j * 4 + 3] ? ((px[j * 4 + 3] << 24) | (px[j * 4 + 2] << 16) | (px[j * 4 + 1] << 8) | px[j * 4]) >>> 0 : 0;
      frames.push({ w: 90, h: 44, ox: 36, oy: 44, c, gem: null });
    }
    result[name] = frames;
  }));
  return result;
}
