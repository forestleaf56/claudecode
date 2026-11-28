package main

import (
	"errors"
	"fmt"
	"strings"
)

// Maps, multiple return values and errors
var stock = map[string]int{"apple": 5, "pear": 0, "plum": 12}

func buy(item string, qty int) (int, error) {
	have, ok := stock[item]
	if !ok {
		return 0, fmt.Errorf("we don't sell %q", item)
	}
	if have < qty {
		return have, errors.New("not enough " + item + "s in stock")
	}
	stock[item] -= qty
	return stock[item], nil
}

func main() {
	for _, order := range []string{"apple:3", "pear:1", "kiwi:2", "plum:12"} {
		parts := strings.Split(order, ":")
		var qty int
		fmt.Sscan(parts[1], &qty)
		left, err := buy(parts[0], qty)
		if err != nil {
			fmt.Println("error:", err)
			continue
		}
		fmt.Printf("bought %d %s, %d left\n", qty, parts[0], left)
	}
}
