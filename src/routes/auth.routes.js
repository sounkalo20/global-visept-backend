const express = require("express");
const router = express.Router();
const {
  register,
  login,
  me,
  logout,
} = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");

// Routes publiques
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Routes protégées
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

module.exports = router;
