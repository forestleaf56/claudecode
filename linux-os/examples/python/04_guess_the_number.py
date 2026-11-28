# A guessing game that reads input (type your guesses when asked)
import random

secret = random.randint(1, 100)
print("I'm thinking of a number between 1 and 100.")
for attempt in range(1, 8):
    guess = int(input(f"Guess #{attempt}: "))
    if guess < secret:
        print("Too low!")
    elif guess > secret:
        print("Too high!")
    else:
        print(f"Correct! You got it in {attempt} tries.")
        break
else:
    print(f"Out of tries - it was {secret}.")
