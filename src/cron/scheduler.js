const cron = require("node-cron");
const History = require("../models/history");

cron.schedule("* * * * *", async () => {
  try {
    const getDeleteDate = new Date();
    getDeleteDate.setDate(getDeleteDate.getDate() - 7);

    const result = await History.updateMany(
      { createdAt: { $lt: getDeleteDate } },
      { deletedAt: new Date() },
    );

    console.log("Cron executed");
  } catch (err) {
    console.log(err);
  }
});
