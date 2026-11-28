<?php
// Classes, constructors and interfaces
interface Shape {
    public function area(): float;
}

class Circle implements Shape {
    public function __construct(private float $r) {}
    public function area(): float { return M_PI * $this->r ** 2; }
}

class Rect implements Shape {
    public function __construct(private float $w, private float $h) {}
    public function area(): float { return $this->w * $this->h; }
}

$shapes = [new Circle(1), new Rect(2, 3), new Circle(2)];
foreach ($shapes as $s) {
    printf("%-6s %6.2f\n", get_class($s), $s->area());
}
$total = array_sum(array_map(fn($s) => $s->area(), $shapes));
printf("Total: %.2f\n", $total);
