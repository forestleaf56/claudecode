// Classes, inheritance, getters and static methods
class Shape {
  constructor(name) { this.name = name; }
  get area() { return 0; }
  describe() { return `${this.name} with area ${this.area.toFixed(2)}`; }
  static largest(shapes) { return shapes.reduce((a, b) => (a.area > b.area ? a : b)); }
}

class Circle extends Shape {
  constructor(r) { super('Circle'); this.r = r; }
  get area() { return Math.PI * this.r ** 2; }
}

class Rect extends Shape {
  constructor(w, h) { super('Rectangle'); this.w = w; this.h = h; }
  get area() { return this.w * this.h; }
}

const shapes = [new Circle(2), new Rect(3, 5), new Circle(1.5)];
shapes.forEach((s) => console.log(s.describe()));
console.log('Largest:', Shape.largest(shapes).name);
