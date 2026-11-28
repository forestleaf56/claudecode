// Interfaces and type annotations
interface Book {
  title: string;
  author: string;
  year: number;
  rating?: number;
}

function describe(book: Book): string {
  const stars = book.rating ? ' ' + '*'.repeat(book.rating) : '';
  return `"${book.title}" by ${book.author} (${book.year})${stars}`;
}

const library: Book[] = [
  { title: 'Dune', author: 'Frank Herbert', year: 1965, rating: 5 },
  { title: 'Neuromancer', author: 'William Gibson', year: 1984 },
  { title: 'The Hobbit', author: 'J. R. R. Tolkien', year: 1937, rating: 4 },
];

library.sort((a: Book, b: Book) => a.year - b.year).forEach((b: Book) => console.log(describe(b)));
