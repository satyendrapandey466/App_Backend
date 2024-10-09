const { isValidObjectId } = require("mongoose");
const PasswordResetToken = require("../models/passwordResetToken");
const { sendError } = require("../utils/helper");

//Function to check the reset token provided and stored in the database are equal or not
exports.isValidPassResetToken = async (req, res, next) => {
    const { token, userId } = req.body;

    if (!token.trim() || !isValidObjectId(userId))
        return sendError(res, "Invalid request!");

    const resetToken = await PasswordResetToken.findOne({ owner: userId });
    if (!resetToken)
        return sendError(res, "Unauthorized access, invalid request!");
//Comparing the token provided with the token stored in the database for the corresponding user
    const matched = await resetToken.compareToken(token);
    if (!matched) return sendError(res, "Unauthorized access, invalid request!");

    req.resetToken = resetToken;
    next();
};