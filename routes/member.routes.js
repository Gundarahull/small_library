const express = require("express");
const {
  validateMemberRegister,
  validateMemberLogin,
} = require("../validations/member");
const {
  MemberRegister,
  login,
} = require("../controllers/Member/member.controller");

const router = express.Router();

router.post("/register", validateMemberRegister, MemberRegister);
router.post("/login", validateMemberLogin, login);

module.exports = router;
