-- Lua basics: tables, loops and functions
local fruits = {"apple", "banana", "cherry"}
for i, f in ipairs(fruits) do
  print(i, f)
end
print("Total: " .. #fruits)

local function factorial(n)
  if n <= 1 then
    return 1
  end
  return n * factorial(n - 1)
end

for n = 1, 6 do
  print(n .. "! = " .. factorial(n))
end
