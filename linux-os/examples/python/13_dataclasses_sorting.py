# Dataclasses and sorting with keys
from dataclasses import dataclass

@dataclass
class Planet:
    name: str
    moons: int
    distance_au: float

planets = [
    Planet("Mercury", 0, 0.39), Planet("Venus", 0, 0.72), Planet("Earth", 1, 1.0),
    Planet("Mars", 2, 1.52), Planet("Jupiter", 95, 5.2), Planet("Saturn", 146, 9.58),
]

print("By number of moons:")
for p in sorted(planets, key=lambda p: p.moons, reverse=True)[:3]:
    print(f"  {p.name:8} {p.moons:4} moons")

farthest = max(planets, key=lambda p: p.distance_au)
print("Farthest:", farthest)
