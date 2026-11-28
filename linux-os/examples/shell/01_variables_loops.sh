#!/bin/bash
# Variables, loops and conditionals
name="Cirrus"
echo "Hello from $name!"

for fruit in apple banana cherry; do
  echo "I like $fruit"
done

for n in 1 2 3 4 5; do
  if [ $((n % 2)) -eq 0 ]; then
    echo "$n is even"
  else
    echo "$n is odd"
  fi
done
