// https://qiita.com/Kanahiro/items/1894ceebc49cd48391c5
// オリジナル・バージョン(Rust)

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct TerrainRgb {
    rgba: Vec<u8>,                         // RGBA配列、JSから値を受け取る
    elevations: Vec<f64>,                  // 標高配列、WASMでの計算結果が入る、JSへ渡す
    pub pointer_to_rgba: *const u8,        // JSからRGBA配列を参照するためのポインタ
    pub pointer_to_elevations: *const f64, // JSから計算結果の標高配列を参照するためのポインタ
}

#[wasm_bindgen]
impl TerrainRgb {
    #[wasm_bindgen(constructor)]
    pub fn new(pixel_length: usize) -> Self {
        let mut rgba: Vec<u8> = Vec::with_capacity(pixel_length); // 配列の初期化
        unsafe { rgba.set_len(pixel_length) } // unsafeで配列長を確定してしまうことで添字アクセスを可能に
        let pointer_to_rgba = rgba.as_mut_ptr(); // RGBA配列へのポインタ=メモリアドレスを取得

        let mut elevations: Vec<f64> = Vec::with_capacity(pixel_length / 4);
        unsafe { elevations.set_len(pixel_length / 4) }
        let pointer_to_elevations = elevations.as_mut_ptr();

        Self {
            rgba,
            elevations,
            pointer_to_rgba,
            pointer_to_elevations,
        }
    }

    pub fn decode_elevations(&mut self) {
        // RGBA値から標高値を計算し配列の値を更新
        for i in 0..(self.rgba.len() / 4) {
            self.elevations[i] = -10000.
                + 6553.6 * self.rgba[4 * i] as f64
                + 25.6 * self.rgba[4 * i + 1] as f64
                + 0.1 * self.rgba[4 * i + 2] as f64;
        }
    }
}
