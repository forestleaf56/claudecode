<?php
// Functions, closures and array helpers
function fibonacci(int $n): array {
    $seq = [0, 1];
    for ($i = 2; $i < $n; $i++) {
        $seq[] = $seq[$i - 1] + $seq[$i - 2];
    }
    return $seq;
}

$fib = fibonacci(12);
echo implode(", ", $fib) . "\n";
$even = array_filter($fib, fn($x) => $x % 2 === 0);
echo "Even: " . implode(", ", $even) . "\n";
$words = explode(" ", "the cloud is a computer somewhere else");
usort($words, fn($a, $b) => strlen($b) - strlen($a));
echo "Longest word: " . $words[0] . "\n";
