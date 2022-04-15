// https://qiita.com/Kanahiro/items/1894ceebc49cd48391c5
// オリジナル・バージョン(JS)

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

      let start = performance.now();

      const jsDecodeElevation = (arr) => {
        const elevs = new Float64Array(arr.length / 4);
        for (let i = 0; i < arr.length / 4; i++) {
          elevs[i] =
            -10000 +
            6553.6 * arr[4 * i] +
            25.6 * arr[4 * i + 1] +
            0.1 * arr[4 * i + 2];
        }
        return elevs;
      };

      jsDecodeElevation(imageData.data);
      resolve(performance.now() - start);
    };
    image.src = './cat.png';
  });
}
