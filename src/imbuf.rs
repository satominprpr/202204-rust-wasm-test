use std::{marker::PhantomData, mem::size_of, ops::Deref};

pub trait AnyValueAllowed {}

pub struct CastedImBuf<T>
where
    T: Sized + AnyValueAllowed,
{
    buf: Vec<u8>,
    _p: PhantomData<T>,
}

impl<T> CastedImBuf<T>
where
    T: Sized + AnyValueAllowed,
{
    pub fn new(buf: Vec<u8>) -> Self {
        if buf.len() % size_of::<T>() != 0 {
            panic!("割り切れないよ")
        }
        Self {
            buf,
            _p: PhantomData,
        }
    }
}

impl<T> Deref for CastedImBuf<T>
where
    T: Sized + AnyValueAllowed,
{
    type Target = [T];

    fn deref(&self) -> &[T] {
        unsafe {
            std::slice::from_raw_parts(self.buf.as_ptr().cast(), self.buf.len() / size_of::<T>())
        }
    }
}
