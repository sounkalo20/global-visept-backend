const express = require("express");
const router = express.Router();
const {
  register,
  login,
  me,
  logout,
  updateProfile,
  updatePassword
} = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } = require("../validators/auth.validator");

// Routes publiques
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Routes protégées
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);
router.put("/profile", authenticate, validate(updateProfileSchema), updateProfile);
router.put("/password", authenticate, validate(updatePasswordSchema), updatePassword);

module.exports = router;
