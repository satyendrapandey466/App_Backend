//This model handles the user related callback functions

const { isValidObjectId } = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const EmailVerificationToken = require("../models/emailVerificationToken");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { sendError, generateRandomByte } = require("../utils/helper");
const PasswordResetToken = require("../models/passwordResetToken");

// This is the create function which handles the user creation for signup process

exports.create = async (req, res) => {
  const { name, email, password } = req.body;

  //Checking the email existence in the database

  const oldUser = await User.findOne({ email });

  if (oldUser) return sendError(res, "This email is already in use!");

  //Creation of the new user

  const newUser = new User({ name, email, password });
  await newUser.save();

  //Generating 6 digit OTP
  let OTP = generateOTP();

  //Saving the OTP in the database
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  console.log(newUser._id, OTP);
  //Sending OTP to the user

  var transport = generateMailTransporter();

  //Data that is to be sent to the mail user had provided

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: newUser.email,
    subject: "Email Verification",
    html: `
      <p>You verification OTP</p>
      <h1>${OTP}</h1>
    `,
  });
  res.status(201).json({
    user: {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
    },
  });
};

//Fuction to verify the email

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;
  console.log(userId, OTP);

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user!");

  //Finding the user by provided userID
  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!", 404);

  //If user is already verified
  if (user.isVerified) return sendError(res, "user is already verified!");
  //Find the hashed token from the database for corresponding userID
  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "token not found!");

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please submit a valid OTP!");

  user.isVerified = true;
  await user.save();
  //Once the user is verified remove the token from the database
  await EmailVerificationToken.findByIdAndDelete(token._id);

  var transport = generateMailTransporter();
  //Data send by the mail after verification
  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Welcome Email",
    html: "<h1>Welcome to our app and thanks for choosing us.</h1>",
  });
  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role:user.role
    },
    message: "Your email is verified.",
  });
};
// Fuction to handle resend the OTP
exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;
  //Finding the user in the database and check if user exists
  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!");
  //if already verified
  if (user.isVerified)
    return sendError(res, "This email id is already verified!");
  //if token is not expired yet
  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our database
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: user._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  // send that otp to our user

  var transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Email Verification",
    html: `
      <p>You verification OTP</p>
      <h1>${OTP}</h1>
    `,
  });

  res.json({
    message: "New OTP has been sent to your registered email accout.",
  });
};
//Fuction to handle password reset
exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  //Checking the existence of mail and user
  if (!email) return sendError(res, "email is missing!");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found!", 404);
  //if password reset link or token is already provided
  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );
  //Generating new random tokens.
  const token = await generateRandomByte();

  //setting token for the reset password reset request
  const newPasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();
  //Reset password URL will the queried token
  const resetPasswordUrl = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;

  const transport = generateMailTransporter();
  //Email data for the reset password request
  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Reset Password Link",
    html: `
      <p>Click here to reset password</p>
      <a href='${resetPasswordUrl}'>Change Password</a>
    `,
  });

  res.json({ message: "Link sent to your email!" });
};

// Function for the sending status of the reset password token to the other middlewares
exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true });
};
// Fuction to handle the reset password action after verifying the password reset token
exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  const user = await User.findById(userId);
  //Checking if old password and new password are equal
  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one!"
    );
  //Resetting the old password
  user.password = newPassword;
  await user.save();
  //Deleting the password reset token after the reset of the password
  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  const transport = generateMailTransporter();
  // Mail data after successful rest password
  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Password Reset Successfully",
    html: `
      <h1>Password Reset Successfully</h1>
      <p>Now you can use new password.</p>

    `,
  });

  res.json({
    message: "Password reset successfully, now you can use new password.",
  });
};

//Fuction which handle the sign-in process

exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  //Finds the user with provided mail
  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email/Password mismatch!");
  //Compares the password
  const matched = await user.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch!");

  const { _id, name, role, isVerified } = user;
  //Creating a web-token having userid
  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

  res.json({
    user: { id: _id, name, email, role, token: jwtToken, isVerified },
  });
};

exports.getAuthDetails = (req, res) => {
  const { user } = req;
  if (!user) {
    return sendError(res, "Unauthorized user", 401);
  }
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      role:user.role
    },
  });
};
