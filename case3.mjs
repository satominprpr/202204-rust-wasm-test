// Rust get_unchecked バージョン

import wasm, { TerrainRgbCase3 } from './pkg/test_for_wasm.js';

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
      wasm().then((instance) => {
        let start = performance.now();
        const terrainrgb = new TerrainRgbCase3(imageData.data.length);
        const rgba = new Uint8Array(
          instance.memory.buffer,
          terrainrgb.pointer_to_rgba,
          imageData.data.length,
        ); // ポインタをもとに、WASM側で初期化した配列の「ビュー」としてJS配列を初期化
        rgba.set(imageData.data); // 画像の配列を丸々コピーする
        terrainrgb.decode_elevations();

        new Float64Array(
          instance.memory.buffer,
          terrainrgb.pointer_to_elevations,
          imageData.data.length / 4,
        ); // ポインタをもとに、WASM側で初期化した配列の「ビュー」としてJS配列を初期化し計算結果を参照する

        resolve(performance.now() - start);
      });
    };
    image.src = './cat.png'; // 1400x1815の画像
  });
};
