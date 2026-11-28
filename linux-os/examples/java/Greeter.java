import java.util.Scanner;

// Reads input with Scanner (type your answers when asked)
public class Greeter {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.print("What's your name? ");
        String name = in.nextLine();
        System.out.print("What year were you born? ");
        int year = in.nextInt();
        int age = java.time.Year.now().getValue() - year;
        System.out.printf("Hello, %s! You turn %d this year.%n", name, age);
    }
}
