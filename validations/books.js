const { body } = require("express-validator");

const validateCreateBook = [
  body("title").notEmpty().withMessage("Please Enter the  title"),

  body("author").notEmpty().withMessage("Please Enter the author"),

  body("isbn").notEmpty().withMessage("Please Enter the  Book Number"),

  body("available_copies")
    .notEmpty()
    .withMessage("Please Enter the  Number of copies")
    .isNumeric()
    .withMessage("Please Enter the Number datatype")
    .isLength({ min: 1 })
    .withMessage("Please Enter Atleast one Copy"),

  body("language").notEmpty().withMessage("Please Enter the Book language"),
];

module.exports = validateCreateBook;
