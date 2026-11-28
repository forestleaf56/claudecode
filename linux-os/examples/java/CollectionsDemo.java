import java.util.*;
import java.util.stream.*;

// Lists, maps and streams
public class CollectionsDemo {
    public static void main(String[] args) {
        List<String> fruits = new ArrayList<>(List.of("banana", "apple", "cherry", "date", "apple"));
        fruits.sort(Comparator.naturalOrder());
        System.out.println("Sorted: " + fruits);

        Map<String, Integer> lengths = new TreeMap<>();
        for (String f : fruits) lengths.put(f, f.length());
        System.out.println("Lengths: " + lengths);

        String longOnes = fruits.stream()
            .distinct()
            .filter(f -> f.length() > 5)
            .map(String::toUpperCase)
            .collect(Collectors.joining(", "));
        System.out.println("Long fruit: " + longOnes);

        int total = fruits.stream().mapToInt(String::length).sum();
        System.out.println("Total letters: " + total);
    }
}
