const nodemailer = require('nodemailer')

//Function to generate OTP of otp_length
exports.generateOTP = (otp_length = 6) => {
    let OTP = "";
    for (let i = 1; i <= otp_length; i++) {
        const randomVal = Math.round(Math.random() * 9);
        OTP += randomVal;
    }

    return "123456";
};

// Generating mail transport data function
exports.generateMailTransporter = () =>
nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "1361d490965d20",
      pass: "f1a0ed64e1db7a"
    }
});