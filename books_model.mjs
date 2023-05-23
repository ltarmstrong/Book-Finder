import mongoose from "mongoose";
import "dotenv/config";
import axios from "axios";

/**
 * This code connects to the MongoDB database using Mongoose, defines a book schema and has 
 * several functions to interact with the Book Finder API and MongoDB.
 * 
 * The searchBooks function connects to the Book Finder API and retrieves books that meet the search criteria. 
 * The retrieved books are then added to the MongoDB database using the addBooksToDatabase function, 
 * which extracts relevant information from the API response and creates a new Book object in the database.
 * 
 * The dropDatabase function deletes all documents in the Book collection in MongoDB, while the sortDatabase 
 * function retrieves all books from the Book collection and sorts them by lexile reading level and categories.
 * 
 * Written by: Johnny Klucinec.
 */

mongoose.connect(process.env.MONGODB_CONNECT_STRING, { useNewUrlParser: true });

const db = mongoose.connection;
db.once("open", () => {
  console.log("Successfully connected to MongoDB using Mongoose!");
});

/**
 * Defines the schema
 */
const bookSchema = mongoose.Schema({
  title: { type: String, required: true },
  book_type: { type: String, required: false },
  lexile: { type: Number, required: true },
  page_count: { type: Number, required: true },
  categories: { type: {}, required: true },
  authors: { type: {}, required: true },
  cover_art_url: { type: String, required: true },
  language: { type: String, required: true },
  isbn: { type: String, required: true },
  summary: { type: String, required: true },
});

/**
 * Connects to Book Finder API with the criteria specified
 */
async function searchBooks(book_type, lexile_min, lexile_max, category) {
  // Set up options for the HTTP request
  const options = {
    method: "GET",
    url: "https://book-finder1.p.rapidapi.com/api/search",
    params: {
      book_type: book_type || "",
      categories: category,
      lexile_min: lexile_min,
      lexile_max: lexile_max,
      results_per_page: "25", // Change if you want more or less results.
      page: "1",
    },
    headers: {
      "X-RapidAPI-Key": "937680a9a5msh3c2d93ae2ad6eb0p11e739jsnd943ea1a778c",
      "X-RapidAPI-Host": "book-finder1.p.rapidapi.com",
    },
  };

  try {
    // Make the HTTP request
    const response = await axios.request(options);

    // Add the books to the database and sort the results by lexile
    return new Promise((resolve, reject) => {
      addBooksToDatabase(response.data)
        .then(() => {
          resolve(sortDatabase());
        })
        .catch((err) => {
          reject(err);
        });
    });
  } catch (error) {
    console.error(error);
  }
}

/**
* Model for Book object in MongoDB
*/
const Book = mongoose.model("Book", bookSchema);

/**

    Adds books to the MongoDB database
    @param {Object} response - Response object from Book Finder API
    @returns {Promise} - Promise that resolves when all books are added to the database
    */
function addBooksToDatabase(response) {
  const { results } = response;
  const promises = [];

  results.forEach((book) => {
    const categoriesArray = [];

    // Extract categories from response and add to array
    for (const key in book.categories) {
      categoriesArray.push(book.categories[key]);
    }

    // Remove "Trade " prefix from book_type if it exists
    let bookType = book.book_type;
    if (bookType.startsWith("Trade ")) {
      bookType = bookType.replace("Trade ", "");
    }

    const authorsArray = [];

    // Extract authors from response and add to array
    for (const key in book.authors) {
      authorsArray.push(book.authors[key]);
    }

    const newBook = new Book({
      title: book.title || "Unknown Title",
      book_type: bookType || "Unknown Book Type",
      lexile: book.measurements.english.lexile || 0,
      page_count: book.page_count || 0,
      categories: categoriesArray,
      authors: authorsArray,
      cover_art_url: book.published_works[0].cover_art_url || "Unknown URL",
      language: book.language || "Unknown Language",
      isbn: book.canonical_isbn || "Unknown ISBN",
      summary: book.summary || "No Summary Available",
    });

    // Create a promise that saves the new Book object to the database
    const savePromise = new Promise((resolve, reject) => {
      newBook.save((err) => {
        if (err) {
          console.log(`Error saving book ${book.title}: ${err}`);
          reject(err);
        } else {
          console.log(`Book ${book.title} saved to database`);
          resolve();
        }
      });
    });

    // Add savePromise to array of promises
    promises.push(savePromise);
  });

  // Return a promise that resolves when all savePromises are resolved
  return Promise.all(promises);
}

/**
* Deletes all documents in the Book collection in MongoDB
*/
function dropDatabase() {
  Book.deleteMany({}, (err) => {
    if (err) {
      console.log("Error deleting documents:", err);
    } else {
      console.log("Documents deleted");
    }
  });
}

/**
* Sorts all books in the Book collection by reading level (lexile)
* @returns {Promise} - Promise that resolves with the sorted books
*/
async function sortDatabase() {
  try {
    const books = await Book.find().sort({ lexile: 1 }).exec();

    const query = { books };
    const sortedBooks = await sortBooksByCategory(query);

    console.log("Documents Sorted");
    return sortedBooks;
  } catch (err) {
    console.error(err);
  }
}

/**
* Sorts books in an array by category and by reading level (lexile)
* @param {Object} query - Query object to find books in the Book collection
* @returns {Object} - Object containing sorted books by category and lexile
*/
async function sortBooksByCategory(query) {
  const books = await Book.find(query).sort({ lexile: 1 }).exec();
  const sortedBooks = {};

  books.forEach((book) => {
    const { categories } = book;
    const category = categories[0];

    if (!sortedBooks[category]) {
      sortedBooks[category] = [];
    }

    // Insert book into the sub-section and sort by lexile
    sortedBooks[category].push(book);
    sortedBooks[category].sort((a, b) => a.lexile - b.lexile);
  });

  return sortedBooks;
}

export { searchBooks, dropDatabase };
