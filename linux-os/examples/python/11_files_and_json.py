# Write and read files, and work with JSON
import json

todos = [
    {"task": "Water the plants", "done": True},
    {"task": "Learn Python", "done": False},
    {"task": "Build a game", "done": False},
]

with open("todos.json", "w") as f:
    json.dump(todos, f, indent=2)
print("Saved todos.json")

with open("todos.json") as f:
    loaded = json.load(f)

for t in loaded:
    mark = "x" if t["done"] else " "
    print(f"[{mark}] {t['task']}")
print(f"{sum(not t['done'] for t in loaded)} left to do")
