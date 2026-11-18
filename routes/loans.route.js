const express = require("express");

const {
  authMiddleware,
  authorizationMiddleware,
  authorizationMemberMiddleware,
} = require("../middleware/auth.middleware");
const {
  loanBook,
  returnBook,
  getMyLoans,
} = require("../controllers/Books/loan.controller");

const router = express.Router();

router.post("/", authMiddleware, authorizationMemberMiddleware, loanBook);
router.post("/:id/return", authMiddleware, returnBook);
router.get(
  "/me/loans",
  authMiddleware,
  authorizationMemberMiddleware,
  getMyLoans,
);

module.exports = router;
