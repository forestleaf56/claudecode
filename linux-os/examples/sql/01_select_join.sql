-- Create tables, insert rows, then query with JOIN and GROUP BY
CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, year INTEGER, author_id INTEGER);

INSERT INTO authors VALUES (1, 'Ursula K. Le Guin'), (2, 'Isaac Asimov'), (3, 'Octavia E. Butler');
INSERT INTO books VALUES
  (1, 'A Wizard of Earthsea', 1968, 1), (2, 'The Left Hand of Darkness', 1969, 1),
  (3, 'Foundation', 1951, 2), (4, 'I, Robot', 1950, 2), (5, 'The End of Eternity', 1955, 2),
  (6, 'Kindred', 1979, 3);

SELECT a.name, COUNT(b.id) AS books, MIN(b.year) AS first_book
FROM authors a JOIN books b ON b.author_id = a.id
GROUP BY a.name
ORDER BY books DESC;

SELECT title, year FROM books WHERE year < 1960 ORDER BY year;
