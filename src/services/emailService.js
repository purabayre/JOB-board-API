const nodemailer = require("nodemailer");

//config
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// send email
exports.sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: '"Job Board" <no-reply@jobboard.com>',
    to,
    subject,
    text,
  });
};
