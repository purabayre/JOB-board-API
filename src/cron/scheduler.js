const cron = require("node-cron");
const mongoose = require("mongoose");

const History = require("../models/history");

cron.schedule("*/10 * * * * *", async () => {
  try {
    const getUpdateDate = new Date();
    getUpdateDate.setDate(getUpdateDate.getDate() - 7);

    const result = await History.updateMany(
      // update mnay first find which document to find , then Find all history records whose createdAt date is less than ($lt) getUpdateDate And isDeleted is false
      {
        createdAt: { $lt: getUpdateDate },
        isDeleted: false,
      },
      {
        $set: { isDeleted: true },
      },
    );

    console.log("Cron executed");
  } catch (err) {
    console.log(err);
  }
});
