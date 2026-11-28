// Iterators, closures and collecting results
fn main() {
    let numbers: Vec<i32> = (1..=10).collect();
    let evens: Vec<i32> = numbers.iter().filter(|n| *n % 2 == 0).cloned().collect();
    let squares: Vec<i32> = numbers.iter().map(|n| n * n).collect();
    let sum: i32 = squares.iter().sum();

    println!("numbers: {:?}", numbers);
    println!("evens:   {:?}", evens);
    println!("squares: {:?}", squares);
    println!("sum of squares: {}", sum);

    let words = vec!["cirrus", "nimbus", "stratus", "cumulus"];
    let longest = words.iter().max_by_key(|w| w.len()).unwrap();
    let caps: Vec<String> = words.iter().map(|w| w.to_uppercase()).collect();
    println!("longest: {}, caps: {}", longest, caps.join(" "));
}
