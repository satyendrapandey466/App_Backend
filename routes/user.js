//This routes file handles all the routes and middleware related to the users

const express = require("express");

const {
  create,
  verifyEmail,
  resendEmailVerificationToken,
  forgetPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  signIn,
  getAuthDetails,
} = require("../controllers/user");
const { isValidPassResetToken } = require("../middlewares/user");
const {
  userValidtor,
  validate,
  validatePassword,
  signInValidator,
} = require("../middlewares/validator");
const { isAuth } = require("../middlewares/isAuth");

const router = express.Router();

//Route for the signing up of the user
router.post("/create", userValidtor, validate, create);

//Route for the signing in of the user
router.post("/sign-in", signInValidator, validate, signIn);

//Router for the email verification
router.post("/verify-email", verifyEmail);

//Route for the resend email OTP
router.post("/resend-email-verification-token", resendEmailVerificationToken);

// Route for the password forgot request
router.post("/forget-password", forgetPassword);

//Route for the verification of the reset token
router.post(
  "/verify-pass-reset-token",
  isValidPassResetToken,
  sendResetPasswordTokenStatus
);

//Route for the password resetting
router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidPassResetToken,
  resetPassword
);

//Routes for authentication
router.get("/is-auth", isAuth, getAuthDetails);
module.exports = router;
