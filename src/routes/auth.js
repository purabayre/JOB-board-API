const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const authController = require("../controllers/auth");

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["employer", "candidate"])
      .withMessage("Role must be employer or candidate"),
  ],
  authController.register,
);

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login,
);

router.post("/logout", authController.logout);

router.post("/refresh", authController.refresh);

module.exports = router;
