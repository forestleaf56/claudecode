// Enums with data and pattern matching
enum Command {
    Move { x: i32, y: i32 },
    Say(String),
    Jump(u32),
    Quit,
}

fn run(cmd: &Command) -> String {
    match cmd {
        Command::Move { x, y } if *x == 0 && *y == 0 => String::from("stay put"),
        Command::Move { x, y } => format!("move by ({}, {})", x, y),
        Command::Say(text) => format!("say \"{}\"", text),
        Command::Jump(h) if *h > 10 => format!("SUPER jump {}m!", h),
        Command::Jump(h) => format!("jump {}m", h),
        Command::Quit => String::from("quit"),
    }
}

fn main() {
    let script = vec![
        Command::Move { x: 3, y: -1 },
        Command::Say(String::from("hello")),
        Command::Move { x: 0, y: 0 },
        Command::Jump(2),
        Command::Jump(12),
        Command::Quit,
    ];
    for (i, c) in script.iter().enumerate() {
        println!("{}: {}", i + 1, run(c));
    }
}
