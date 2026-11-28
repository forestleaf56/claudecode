# Draw a spiral of stars using only print (no graphics needed)
import math

size = 21
grid = [[" "] * size for _ in range(size)]
for i in range(140):
    angle = i * 0.35
    r = i * 0.07
    x = int(size / 2 + r * math.cos(angle))
    y = int(size / 2 + r * math.sin(angle))
    if 0 <= x < size and 0 <= y < size:
        grid[y][x] = "*"
for row in grid:
    print(" ".join(row))
