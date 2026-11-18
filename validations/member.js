const { body } = require("express-validator");

const validateMemberRegister = [
  body("name")
    .notEmpty()
    .withMessage("Please Enter the  Name")
    .isString()
    .withMessage("Name Should be in the String DataType")
    .isLength({ min: 1, max: 15 })
    .withMessage(" Name, Atleast One charcter"),

  body("email")
    .notEmpty()
    .withMessage("Please Enter the Email")
    .isEmail()
    .withMessage("Email Should be in the proper format"),

  body("password")
    .notEmpty()
    .withMessage("Please Enter the  password")
    .isLength({ min: 7, max: 15 })
    .withMessage(" Password, Atleast 7 charcter"),
];

const validateMemberLogin = [
  body("email")
    .notEmpty()
    .withMessage("Please Enter the Email")
    .isEmail()
    .withMessage("Email Should be in the proper format"),

  body("password")
    .notEmpty()
    .withMessage("Please Enter the  password")
    .isLength({ min: 7, max: 15 })
    .withMessage(" Password, Atleast 7 charcter"),
];

module.exports = { validateMemberRegister, validateMemberLogin };
