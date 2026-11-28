using System;
using System.Linq;
using System.Collections.Generic;

// LINQ queries over collections
class Program
{
    class Movie
    {
        public string Title; public int Year; public double Rating;
        public Movie(string t, int y, double r) { Title = t; Year = y; Rating = r; }
    }

    static void Main()
    {
        var movies = new List<Movie>
        {
            new Movie("Alien", 1979, 8.5), new Movie("Arrival", 2016, 7.9),
            new Movie("Blade Runner", 1982, 8.1), new Movie("Interstellar", 2014, 8.7),
        };

        var best = movies.Where(m => m.Rating > 8).OrderByDescending(m => m.Rating);
        foreach (var m in best)
            Console.WriteLine($"{m.Title,-14} {m.Year} {m.Rating}");

        var byDecade = movies.GroupBy(m => m.Year / 10 * 10);
        foreach (var g in byDecade)
            Console.WriteLine($"{g.Key}s: {string.Join(", ", g.Select(m => m.Title))}");

        Console.WriteLine($"Average rating: {movies.Average(m => m.Rating):F2}");
    }
}
