# FizzBuzz, Ruby style
(1..20).each do |i|
  out = ""
  out += "Fizz" if i % 3 == 0
  out += "Buzz" if i % 5 == 0
  puts out.empty? ? i : out
end
