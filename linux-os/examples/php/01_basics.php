<?php
// PHP basics: arrays, loops and string interpolation
$names = ["Ada", "Linus", "Grace"];
foreach ($names as $name) {
    echo "Hello, $name!\n";
}
echo "Count: " . count($names) . "\n";

$scores = ["Ada" => 92, "Linus" => 87, "Grace" => 99];
arsort($scores);
foreach ($scores as $who => $score) {
    printf("%-6s %3d\n", $who, $score);
}
echo "Average: " . round(array_sum($scores) / count($scores), 1) . "\n";
