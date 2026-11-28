# Conway's Game of Life in the terminal
import time

W, H = 20, 10
cells = {(1, 0), (2, 1), (0, 2), (1, 2), (2, 2)}  # a glider

def step(alive):
    counts = {}
    for (x, y) in alive:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if dx or dy:
                    key = ((x + dx) % W, (y + dy) % H)
                    counts[key] = counts.get(key, 0) + 1
    return {c for c, n in counts.items() if n == 3 or (n == 2 and c in alive)}

for gen in range(4):
    print(f"Generation {gen}")
    for y in range(H):
        print("".join("#" if (x, y) in cells else "." for x in range(W)))
    cells = step(cells)
    print()
