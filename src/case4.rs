// Rust chunks バージョン

use js_sys::{Float64Array, Uint8ClampedArray};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct TerrainRgbCase4 {
    elevations: Option<Vec<f64>>, // 標高配列、wasmでの計算結果が入る、jsへ渡す
}

#[wasm_bindgen]
impl TerrainRgbCase4 {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { elevations: None }
    }

    #[wasm_bindgen]
    pub fn decode_elevations(&mut self, rgba: Uint8ClampedArray) {
        let elevations = rgba
            .to_vec()
            .chunks(4)
            .into_iter()
            .map(|color| {
                // rgba値から標高値を計算
                if let [r, g, b, _] = color {
                    -10000. + 6553.6 * *r as f64 + 25.6 * *g as f64 + 0.1 * *b as f64
                } else {
                    panic!("割り切れないよ")
                }
            })
            .collect::<Vec<_>>();
        self.elevations = Some(elevations)
    }

    #[wasm_bindgen]
    pub fn get_elevations(&self) -> Option<Float64Array> {
        self.elevations
            .as_ref()
            .map(|e| unsafe { Float64Array::view(&e) })
    }
}
