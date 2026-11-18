const express = require("express");

const {
  authMiddleware,
  authorizationMiddleware,
  authorizationMemberMiddleware,
} = require("../middleware/auth.middleware");
const { getOverdueReport } = require("../controllers/Books/reservations.controller");


const router = express.Router();

router.get("/overdue", authMiddleware, authorizationMiddleware, getOverdueReport);




module.exports = router;
