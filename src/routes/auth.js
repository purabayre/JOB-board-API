const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const authController = require("../controllers/auth");

router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 5 }),
    body("role").isIn(["employer", "candidate"]),
  ],
  authController.register,
);

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

module.exports = router;
