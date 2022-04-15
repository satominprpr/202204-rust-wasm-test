// Rust Rgba 型定義バージョン

import wasm, { TerrainRgbCase5 } from './pkg/test_for_wasm.js';

export default () => {
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = '';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      wasm().then((_) => {
        let start = performance.now();
        const terrainrgb = new TerrainRgbCase5();
        terrainrgb.decode_elevations(imageData.data);
        terrainrgb.get_elevations();
        resolve(performance.now() - start);
      });
    };
    image.src = './cat.png'; // 1400x1815の画像
  });
};
