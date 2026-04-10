const cron = require("node-cron");
const History = require("../models/history");

cron.schedule("*/10 * * * * *", async () => {
  try {
    const getUpdateDate = new Date();
    getUpdateDate.setDate(getUpdateDate.getDate() - 7);

    const result = await History.updateMany(
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
