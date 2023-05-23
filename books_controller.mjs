import "dotenv/config";
import * as books from "./books_model.mjs";
import express from "express";
import cors from "cors"; 

/**
 * Sets up an Express server that listens for GET requests on the /books endpoint. 
 * The server clears the database, sets the lexile range based on the reading level specified in the query parameters, 
 * and searches the database for books that match the specified criteria. If there are any matching books, they are 
 * returned in the response. If the request is invalid, an error message is returned instead.
 * 
 * Written by: John Klucinec
 */

const { PORT } = process.env;

const app = express();

app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// GET endpoint for fetching books based on reading level and categories
app.get("/books", (req, res) => {
  // Clears the current database.
  books.dropDatabase();                             

  // Initialize default lexile range
  let lexile_min = -650;    // Lowest lexile the API can process. DO NOT CHANGE.
  let lexile_max = 2150;    // Highest lexile the API can process. DO NOT CHANGE.
  let { reading_level } = req.query;

  // Set lexile range based on reading level. Customize as needed.
  if (reading_level == "beginner") {
    lexile_min = -650;
    lexile_max = 500;
  } else if (reading_level == "intermediate") {
    lexile_min = 500;
    lexile_max = 1500;
  } else if (reading_level == "advanced") {
    lexile_min = 1500;
    lexile_max = 2150;
  }

  // Replace "%26" with "&" in the categories value
  const categories = req.query.categories.replace(/%26/g, "&");

  // Search for books based on query parameters
  books
    .searchBooks(
      req.query.book_type,
      lexile_min,
      lexile_max,
      categories
    )
    .then((book) => {
      // Return the resulting books
      res.status(201).json(book);
    })
    .catch((error) => {
      // Return an error message if the request is invalid
      res.status(400).json({ Error: "Invalid request :(" });
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
