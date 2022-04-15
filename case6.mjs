// おまけの WebGL バージョン

const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  in vec2 a_texCoord;
  out vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
  `;

const fragmentShaderSource = `#version 300 es
  precision highp float;
  uniform sampler2D u_image;
  in vec2 v_texCoord;
  out vec4 outColor;

  // https://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
  float shift_right (float v, float amt) { 
    v = floor(v) + 0.5; 
    return floor(v / exp2(amt)); 
  }
  float shift_left (float v, float amt) { 
      return floor(v * exp2(amt) + 0.5); 
  }
  float mask_last (float v, float bits) { 
      return mod(v, shift_left(1.0, bits)); 
  }
  float extract_bits (float num, float from, float to) { 
      from = floor(from + 0.5); to = floor(to + 0.5); 
      return mask_last(shift_right(num, from), to - from); 
  }
  vec4 encode_float (float val) { 
      if (val == 0.0) return vec4(0, 0, 0, 0); 
      float sign = val > 0.0 ? 0.0 : 1.0; 
      val = abs(val); 
      float exponent = floor(log2(val)); 
      float biased_exponent = exponent + 127.0; 
      float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0; 
      float t = biased_exponent / 2.0; 
      float last_bit_of_biased_exponent = fract(t) * 2.0; 
      float remaining_bits_of_biased_exponent = floor(t); 
      float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0; 
      float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0; 
      float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0; 
      float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; 
      return vec4(byte4, byte3, byte2, byte1); 
  }

  void main() {
    vec4 color = texture(u_image, v_texCoord);
    float elevation =
      -10000.0 +
      6553.6 * color.r * 255.0 +
      25.6 * color.g * 255.0 +
      0.1 * color.b * 255.0;
    outColor = encode_float(elevation);
  }
`;

class ElevationsGL {
  constructor() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      return;
    }

    const program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

    const vaoPositions = gl.createVertexArray();
    gl.bindVertexArray(vaoPositions);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(
      positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(
      texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.gl = gl;
    this.program = program;
    this.vaoPositions = vaoPositions;
    this.count = positions.length / 2;
  }

  draw(image) {
    const gl = this.gl;
    gl.canvas.width = image.width;
    gl.canvas.height = image.height;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vaoPositions);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);

    const pixels = new Uint8Array(image.width * image.height * 4);
    gl.readPixels(0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const elevations = new Float32Array(pixels.buffer);
    return elevations;
  }
}

export default () => {
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = '';
    image.onload = () => {
      const elevationgl = new ElevationsGL();
      const draw = performance.now();
      elevationgl.draw(image);
      resolve(performance.now() - draw);
    }
    image.src = './cat.png'; // 1400x1815の画像
  });
};
