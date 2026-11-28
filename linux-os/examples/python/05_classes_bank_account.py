# Classes, methods, exceptions and __str__
class InsufficientFunds(Exception):
    pass

class BankAccount:
    def __init__(self, owner, balance=0.0):
        self.owner = owner
        self.balance = balance
        self.history = []

    def deposit(self, amount):
        self.balance += amount
        self.history.append(("deposit", amount))

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFunds(f"{self.owner} only has {self.balance:.2f}")
        self.balance -= amount
        self.history.append(("withdraw", amount))

    def __str__(self):
        return f"{self.owner}: {self.balance:.2f} ({len(self.history)} transactions)"

acct = BankAccount("Ada", 100)
acct.deposit(50)
acct.withdraw(30)
print(acct)
try:
    acct.withdraw(1000)
except InsufficientFunds as e:
    print("Error:", e)
