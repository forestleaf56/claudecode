# Ruby basics: strings, arrays, hashes and blocks
def greet(name)
  "Hello, #{name}!"
end

puts greet("Ruby")

fruits = ["apple", "banana", "cherry"]
fruits.each_with_index do |fruit, i|
  puts "#{i + 1}. #{fruit.capitalize}"
end

ages = { "Ada" => 36, "Grace" => 85, "Linus" => 54 }
ages.each do |name, age|
  puts "#{name} is #{age}"
end
puts "Oldest: #{ages.max_by { |_, age| age }.first}"
puts (1..10).select(&:even?).map { |n| n * n }.inspect
