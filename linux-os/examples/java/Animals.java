import java.util.List;

// Interfaces, abstract classes and polymorphism
public class Animals {
    interface Speaker {
        String speak();
    }

    static abstract class Animal implements Speaker {
        protected final String name;
        Animal(String name) { this.name = name; }
        public String toString() { return name + " says " + speak(); }
    }

    static class Dog extends Animal {
        Dog(String name) { super(name); }
        public String speak() { return "Woof!"; }
    }

    static class Cat extends Animal {
        Cat(String name) { super(name); }
        public String speak() { return "Meow."; }
    }

    public static void main(String[] args) {
        List<Animal> pets = List.of(new Dog("Rex"), new Cat("Tom"), new Dog("Fido"));
        for (Animal a : pets) {
            System.out.println(a);
        }
    }
}
