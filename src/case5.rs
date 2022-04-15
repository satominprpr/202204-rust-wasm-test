// Rust Rgba 型定義バージョン

use js_sys::{Float64Array, Uint8ClampedArray};
use wasm_bindgen::prelude::*;

#[repr(packed)]
struct Rgba {
    r: u8,
    g: u8,
    b: u8,
    #[allow(dead_code)]
    a: u8,
}

struct RgbaBuf<'a> {
    buf: &'a [u8],
}

impl<'a> RgbaBuf<'a> {
    fn new(buf: &'a [u8]) -> Self {
        if buf.len() % 4 != 0 {
            panic!("割り切れないよ")
        }
        Self { buf }
    }

    fn to_rgbabuf(&self) -> &'a [Rgba] {
        unsafe {
            std::slice::from_raw_parts(std::ptr::addr_of!(*self.buf).cast(), self.buf.len() / 4)
        }
    }
}

#[wasm_bindgen]
pub struct TerrainRgbCase5 {
    elevations: Option<Vec<f64>>, // 標高配列、wasmでの計算結果が入る、jsへ渡す
}

#[wasm_bindgen]
impl TerrainRgbCase5 {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { elevations: None }
    }

    #[wasm_bindgen]
    pub fn decode_elevations(&mut self, rgba: Uint8ClampedArray) {
        let elevations = RgbaBuf::new(&rgba.to_vec())
            .to_rgbabuf()
            .into_iter()
            // rgba値から標高値を計算
            .map(|Rgba { r, g, b, .. }| {
                -10000. + 6553.6 * *r as f64 + 25.6 * *g as f64 + 0.1 * *b as f64
            })
            .collect::<Vec<_>>();
        self.elevations = Some(elevations);
    }

    #[wasm_bindgen]
    pub fn get_elevations(&self) -> Option<Float64Array> {
        self.elevations
            .as_ref()
            .map(|e| unsafe { Float64Array::view(&e) })
    }
}
