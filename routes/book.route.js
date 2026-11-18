const express = require("express");
const {
  createBook,
  updateBook,
} = require("../controllers/Books/book.controller");
const {
  authMiddleware,
  authorizationMiddleware,
} = require("../middleware/auth.middleware");
const validateCreateBook = require("../validations/books");

const router = express.Router();

router.post(
  "/",
  validateCreateBook,
  authMiddleware,
  authorizationMiddleware,
  createBook,
);

router.patch("/:bookId", authMiddleware, authorizationMiddleware, updateBook);

module.exports = router;
