using System;
using System.Collections.Generic;

// Classes, properties and interfaces
interface IAnimal
{
    string Name { get; }
    string Speak();
}

class Dog : IAnimal
{
    public string Name { get; }
    public Dog(string name) { Name = name; }
    public string Speak() => "Woof!";
}

class Cat : IAnimal
{
    public string Name { get; }
    public Cat(string name) { Name = name; }
    public string Speak() => "Meow.";
}

class Program
{
    static void Main()
    {
        var pets = new List<IAnimal> { new Dog("Rex"), new Cat("Tom") };
        foreach (var p in pets)
            Console.WriteLine($"{p.Name} says {p.Speak()}");
        var counts = new Dictionary<string, int> { ["dogs"] = 1, ["cats"] = 1 };
        counts["dogs"]++;
        foreach (var kv in counts)
            Console.WriteLine($"{kv.Key}: {kv.Value}");
    }
}
