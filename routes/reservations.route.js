const express = require("express");

const {
  authMiddleware,
  authorizationMiddleware,
  authorizationMemberMiddleware,
} = require("../middleware/auth.middleware");
const { cancelReservation } = require("../controllers/Books/reservations.controller");


const router = express.Router();

router.delete("/:id", authMiddleware, authorizationMiddleware, cancelReservation);




module.exports = router;
