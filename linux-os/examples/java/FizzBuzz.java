public class FizzBuzz {
    public static void main(String[] args) {
        for (int i = 1; i <= 20; i++) {
            String out = "";
            if (i % 3 == 0) out += "Fizz";
            if (i % 5 == 0) out += "Buzz";
            System.out.println(out.isEmpty() ? String.valueOf(i) : out);
        }
    }
}
