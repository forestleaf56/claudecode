// Option and Result for safe error handling
fn parse_age(text: &str) -> Result<u32, String> {
    let n: u32 = text.trim().parse().map_err(|_| format!("'{}' is not a number", text))?;
    if n > 150 {
        return Err(format!("{} is too old to be true", n));
    }
    Ok(n)
}

fn find_user(id: u32) -> Option<&'static str> {
    match id {
        1 => Some("ada"),
        2 => Some("grace"),
        _ => None,
    }
}

fn main() {
    for input in ["42", "abc", "200", " 7 "] {
        match parse_age(input) {
            Ok(age) => println!("age = {}", age),
            Err(e) => println!("error: {}", e),
        }
    }
    for id in 1..=3 {
        println!("user {} -> {}", id, find_user(id).unwrap_or("<nobody>"));
    }
}
