package main

import (
	"fmt"
	"sort"
)

// Structs, methods and sorting slices
type Planet struct {
	Name  string
	Moons int
	Rings bool
}

func (p Planet) Describe() string {
	rings := "no rings"
	if p.Rings {
		rings = "rings"
	}
	return fmt.Sprintf("%-8s %3d moons, %s", p.Name, p.Moons, rings)
}

func main() {
	planets := []Planet{{"Earth", 1, false}, {"Saturn", 146, true}, {"Mars", 2, false}, {"Jupiter", 95, true}}
	sort.Slice(planets, func(i, j int) bool { return planets[i].Moons > planets[j].Moons })
	for _, p := range planets {
		fmt.Println(p.Describe())
	}
}
