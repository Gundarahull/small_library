const express = require("express");
const {
  createBook,
  updateBook,
  getBooks,
} = require("../controllers/Books/book.controller");
const {
  authMiddleware,
  authorizationMiddleware,
  authorizationMemberMiddleware,
} = require("../middleware/auth.middleware");
const validateCreateBook = require("../validations/books");
const {
  createReservation,
} = require("../controllers/Books/reservations.controller");

const router = express.Router();

router.post(
  "/",
  validateCreateBook,
  authMiddleware,
  authorizationMiddleware,
  createBook,
);

router.patch("/:bookId", authMiddleware, authorizationMiddleware, updateBook);
router.get("/", authMiddleware, getBooks);

router.post(
  "/:id/reservations",
  authMiddleware,
  authorizationMemberMiddleware,
  createReservation,
);

module.exports = router;
