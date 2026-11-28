-- Tables as objects with metatables
local Account = {}
Account.__index = Account

function Account.new(owner, balance)
  return setmetatable({owner = owner, balance = balance or 0}, Account)
end

function Account:deposit(v)
  self.balance = self.balance + v
end

function Account:withdraw(v)
  if v > self.balance then
    error("insufficient funds")
  end
  self.balance = self.balance - v
end

local acc = Account.new("Ada", 100)
acc:deposit(50)
acc:withdraw(30)
print(acc.owner .. " has " .. acc.balance)
local ok, err = pcall(function() acc:withdraw(1000) end)
print("withdraw 1000 ok? " .. tostring(ok))
