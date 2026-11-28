# Count word frequencies with a dictionary and Counter
from collections import Counter

text = """It was the best of times, it was the worst of times,
it was the age of wisdom, it was the age of foolishness"""

words = [w.strip(",.").lower() for w in text.split()]
counts = Counter(words)
for word, n in counts.most_common(5):
    print(f"{word:>8} {'#' * n} {n}")
