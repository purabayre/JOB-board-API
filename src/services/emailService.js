const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

// Configure SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// send email
exports.sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: "purabayre293@gmail.com", 
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
