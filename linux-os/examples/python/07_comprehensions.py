# List, dict and set comprehensions
squares = [n * n for n in range(1, 11)]
evens = [n for n in squares if n % 2 == 0]
lengths = {word: len(word) for word in ["cloud", "rain", "thunder"]}
letters = {ch for ch in "mississippi"}
matrix = [[r * c for c in range(1, 4)] for r in range(1, 4)]

print("squares:", squares)
print("even squares:", evens)
print("lengths:", lengths)
print("unique letters:", sorted(letters))
for row in matrix:
    print(row)
