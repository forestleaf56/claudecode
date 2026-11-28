-- Aggregates, CASE and subqueries
CREATE TABLE sales (region TEXT, product TEXT, amount REAL);
INSERT INTO sales VALUES
  ('North', 'Umbrella', 120), ('North', 'Raincoat', 340), ('South', 'Umbrella', 80),
  ('South', 'Sunglasses', 410), ('East', 'Umbrella', 150), ('East', 'Raincoat', 90);

SELECT region, SUM(amount) AS total,
       CASE WHEN SUM(amount) > 400 THEN 'great' ELSE 'ok' END AS verdict
FROM sales GROUP BY region ORDER BY total DESC;

SELECT product, amount FROM sales
WHERE amount > (SELECT AVG(amount) FROM sales);
