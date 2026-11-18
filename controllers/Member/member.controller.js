const { validationResult } = require("express-validator");
const Member = require("../../models/Member.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const MemberRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: errors.array(),
      });
    }
    const { name, password } = req.body;
    const email = req.body.email.trim().toLowerCase();

    const emailCheck = await Member.findOne({
      where: {
        email: email,
      },
    });

    if (emailCheck) {
      return res.status(409).json({
        success: false,
        message: "Email Already exists",
        errors: "Conflict Error",
      });
    }

    //hashing
    const password_hash = await bcrypt.hash(password, 10);

    //member
    const member = await Member.create({
      name: name.trim(),
      email,
      password_hash,
      role: "member",
    });

    const member_data = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      created_at: member.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: "Member Registred Succesfully",
      data: member_data,
    });
  } catch (error) {
    console.error("[MemberRegister Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at Member Registration controller",
      errors: error,
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation Failed",
        errors: errors.array(),
      });
    }

    //UserCheck
    const { password } = req.body;
    const email = req.body.email.trim().toLowerCase();
    const emailCheck = await Member.findOne({
      where: {
        email: email,
      },
    });

    if (!emailCheck) {
      return res.status(404).json({
        success: false,
        message: "User with this Email not Found",
        errors: "Not Found",
      });
    }

    //check password
    const isPassword = await bcrypt.compare(password, emailCheck.password_hash);

    if (!isPassword) {
      return res.status(403).json({
        success: false,
        message: "Password Inccorect",
        errors: "UnAuthorized",
      });
    }

    const member_data = {
      id: emailCheck.id,
      role: emailCheck.role,
    };

    //JWT
    const token = jwt.sign(member_data, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true, //blocks to modify or read the cookie
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", //only browser can send
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      message: "Member Logined Succesfully",
      token,
      data: member_data,
    });
  } catch (error) {
    console.error("[MemberRegister Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Error at Member Login controller",
      errors: error,
    });
  }
};

module.exports = {
  MemberRegister,
  login,
};
