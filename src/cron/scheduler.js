const cron = require("node-cron");
const History = require("../models/history");

cron.schedule("0 0 */7 * *", async () => {
  console.log("marked as deleted");

  try {
    const getDeleteDate = new Date();
    getDeleteDate.setDate(getDeleteDate.getDate() - 7);

    const result = await History.updateMany(
      { createdAt: { $lt: getDeleteDate } },
      { deletedAt: new Date() },
    );
  } catch (err) {
    console.log(err);
  }
});
