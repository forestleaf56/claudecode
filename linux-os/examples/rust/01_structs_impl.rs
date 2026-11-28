// Structs, impl blocks and traits
use std::fmt;

struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    fn new(width: f64, height: f64) -> Self {
        Rectangle { width, height }
    }
    fn area(&self) -> f64 {
        self.width * self.height
    }
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

impl fmt::Display for Rectangle {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}x{}", self.width, self.height)
    }
}

fn main() {
    let big = Rectangle::new(10.0, 8.0);
    let small = Rectangle::new(3.0, 2.0);
    println!("{} has area {:.1}", big, big.area());
    println!("{} has area {:.1}", small, small.area());
    println!("Can {} hold {}? {}", big, small, big.can_hold(&small));
}
