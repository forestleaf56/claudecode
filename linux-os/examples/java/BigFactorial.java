import java.math.BigInteger;

// BigInteger handles numbers of any size
public class BigFactorial {
    static BigInteger factorial(int n) {
        BigInteger result = BigInteger.ONE;
        for (int i = 2; i <= n; i++) result = result.multiply(BigInteger.valueOf(i));
        return result;
    }

    public static void main(String[] args) {
        for (int n : new int[] {5, 20, 50}) {
            System.out.println(n + "! = " + factorial(n));
        }
        System.out.println("100! has " + factorial(100).toString().length() + " digits");
    }
}
