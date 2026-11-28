// Data classes and collection functions
data class Player(val name: String, val score: Int, val level: Int)

fun main() {
    val players = listOf(
        Player("Ada", 1200, 7),
        Player("Bob", 950, 5),
        Player("Cy", 1500, 9),
    )
    val top = players.maxByOrNull { it.score }
    println("Top player: $top")
    players.sortedByDescending { it.level }.forEach { println("${it.name}: level ${it.level}") }
    val promoted = players.map { it.copy(level = it.level + 1) }
    println("After promotion: ${promoted.map { it.level }}")
    println("Total score: ${players.sumOf { it.score }}")
}
