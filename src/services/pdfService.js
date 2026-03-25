const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// generate PDF
exports.generatePDF = (application, job, user) => {
  return new Promise((resolve, reject) => {
    const dir = "uploads/receipts";

    // ensure folder exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, `${user._id}-${application._id}.pdf`);

    // if already exists → reuse
    if (fs.existsSync(filePath)) {
      return resolve(filePath);
    }

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("Job Application Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Candidate: ${user.name}`);
    doc.text(`Job Title: ${job.title}`);
    doc.text(`Applied At: ${application.appliedAt}`);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};
