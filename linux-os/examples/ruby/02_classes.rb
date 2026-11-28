# Classes, attr_accessor, inheritance and modules
module Greeting
  def hello
    "Hi, I'm #{name}"
  end
end

class Robot
  include Greeting
  attr_accessor :name, :battery

  def initialize(name)
    @name = name
    @battery = 100
  end

  def work(hours)
    @battery = [@battery - hours * 15, 0].max
    self
  end

  def to_s
    "#{name} (#{battery}% battery)"
  end
end

class CleaningRobot < Robot
  def work(hours)
    puts "#{name} cleans for #{hours}h"
    super
  end
end

r = CleaningRobot.new("Vacuumo")
puts r.hello
r.work(2).work(3)
puts r
