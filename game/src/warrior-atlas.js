// The atlas is assembled from Clembod's original 69x44 (or 64x44) frames.
// Every frame shares the same foot position so facing and animation stay aligned.
export async function loadWarriorAtlas(uri) {
  const image = new Image(); image.src = uri; await image.decode();
  if (image.width !== 759 || image.height !== 440) throw new Error('Invalid warrior atlas');
  const rows = [['Idle',6],['Run',8],['Jump',3],['Fall',3],['Attack1',6],['Attack2',6],['Slide',5],['Dash',7],['Hit',4],['Death',11]];
  const canvas = document.createElement('canvas'); canvas.width = 69; canvas.height = 44;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const result = {};
  rows.forEach(([name,count], y) => {
    result[name] = [];
    for (let x = 0; x < count; x++) {
      ctx.clearRect(0, 0, 69, 44); ctx.drawImage(image, x * 69, y * 44, 69, 44, 0, 0, 69, 44);
      const px = ctx.getImageData(0, 0, 69, 44).data, c = new Uint32Array(69 * 44);
      for (let i = 0; i < c.length; i++) c[i] = px[i * 4 + 3] ? ((px[i * 4 + 3] << 24) | (px[i * 4 + 2] << 16) | (px[i * 4 + 1] << 8) | px[i * 4]) >>> 0 : 0;
      result[name].push({ w: 69, h: 44, ox: 27, oy: 43, c, gem: null });
    }
  });
  return result;
}
