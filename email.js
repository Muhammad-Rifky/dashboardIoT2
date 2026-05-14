require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(subject, html, to) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html   // <-- penting, bukan text
    });

    console.log("✅ EMAIL SENT:", to);
  } catch (err) {
    console.log("❌ EMAIL ERROR:", err.message);
  }
}

module.exports = { sendEmail };