# Recursion: Towers of Hanoi
moves = 0

def hanoi(n, source, target, spare):
    global moves
    if n == 0:
        return
    hanoi(n - 1, source, spare, target)
    moves += 1
    print(f"Move disk {n} from {source} to {target}")
    hanoi(n - 1, spare, target, source)

hanoi(3, "A", "C", "B")
print("Total moves:", moves)
