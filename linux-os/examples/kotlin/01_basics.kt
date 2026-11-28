// Kotlin basics: val/var, string templates, when, ranges
fun describe(n: Int): String = when {
    n % 15 == 0 -> "FizzBuzz"
    n % 3 == 0 -> "Fizz"
    n % 5 == 0 -> "Buzz"
    else -> n.toString()
}

fun main() {
    val name = "Kotlin"
    println("Hello, $name! ${name.length} letters")
    for (i in 1..15) println(describe(i))
    val langs = listOf("Kotlin", "Java", "Scala")
    println(langs.filter { it.length > 4 }.map { it.uppercase() })
}
