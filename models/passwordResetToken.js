const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// This is my token Schema for password reset 

const passwordResetTokenSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now(),
    },
});

// Made to hash the value of token before storing in the database

passwordResetTokenSchema.pre("save", async function (next) {
    if (this.isModified("token")) {
        this.token = await bcrypt.hash(this.token, 10);
    }

    next();
});

//Method to compare the two hash tokens are same or not

passwordResetTokenSchema.methods.compareToken = async function (token) {
    const result = await bcrypt.compare(token, this.token);
    return result;
};

//Model creation

module.exports = mongoose.model(
    "PasswordResetToken",
    passwordResetTokenSchema
);