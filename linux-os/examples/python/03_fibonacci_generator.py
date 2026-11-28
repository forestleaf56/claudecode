# Generators produce values lazily, one at a time
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

for i, n in enumerate(fibonacci()):
    if i >= 20:
        break
    print(f"F({i:2}) = {n}")
