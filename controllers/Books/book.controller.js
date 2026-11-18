const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const Book = require("../../models/Books.model");
const { QueryTypes } = require("sequelize");
const connectDB = require("../../config/db");

const createBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: errors.array(),
      });
    }

    const { title, author, total_copies, available_copies, language } =
      req.body;
    const isbn = req.body.isbn.trim();

    console.log("--ISBN---", isbn);
    

    const isbnCheck = await Book.findOne({ where: { isbn } });
    if (isbnCheck) {
      return res.status(409).json({
        success: false,
        message: "Book with this ISBN already exists",
        errors: "Conflict Error",
      });
    }

    const total = Number(total_copies);
    const available =
      available_copies !== undefined ? Number(available_copies) : total;

    if (available > total || total < 1 || available < 0) {
      return res.status(400).json({
        success: false,
        message: "available_copies cannot exceed total_copies or be negative",
        errors: "Invalid Copy Count",
      });
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn,
      total_copies: total,
      available_copies: available,
      language: language ? language.trim() : "English",
    });

    return res.status(201).json({
      success: true,
      message: "Book registered successfully",
      data: book,
    });
  } catch (error) {
    console.error("[createBook Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at createBook controller",
      errors: "Internal Server Error",
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, isbn, total_copies, available_copies, language } =
      req.body;

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
        errors: "Not Found",
      });
    }

    // Check ISBN  , isbn belongs to another book
    if (isbn && isbn.trim() !== book.isbn) {
      const cleanIsbn = isbn.trim();

      const SQL_QUERY =
        "SELECT * FROM books WHERE isbn = :isbn AND id != :bookID LIMIT 1";

      const [duplicateIsbn] = await connectDB.query(SQL_QUERY, {
        replacements: {
          isbn: cleanIsbn,
          bookID: book.id,
        },
        type: QueryTypes.SELECT,
      });
      if (duplicateIsbn) {
        return res.status(409).json({
          success: false,
          message: "Another book with this ISBN already exists",
          errors: "Conflict Error",
        });
      }
      book.isbn = cleanIsbn;
    }

    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (language !== undefined) book.language = language.trim();

    // Safely handle inventory changes without breaking borrowed copies
    const currentlyBorrowed = book.total_copies - book.available_copies;
    const newTotal =
      total_copies !== undefined ? Number(total_copies) : book.total_copies;

    if (newTotal < currentlyBorrowed) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total_copies below currently borrowed count (${currentlyBorrowed})`,
        errors: "Invalid Copy Count",
      });
    }

    const newAvailable =
      available_copies !== undefined
        ? Number(available_copies)
        : newTotal - currentlyBorrowed;

    if (newAvailable < 0 || newAvailable > newTotal) {
      return res.status(400).json({
        success: false,
        message: "available_copies must be between 0 and total_copies",
        errors: "Invalid Copy Count",
      });
    }

    book.total_copies = newTotal;
    book.available_copies = newAvailable;

    await book.save();

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    console.error("[updateBook Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at updateBook controller",
      errors: "Internal Server Error",
    });
  }
};

module.exports = {
  createBook,
  updateBook,
};
