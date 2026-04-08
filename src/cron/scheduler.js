const cron = require("node-cron");
const History = require("../models/history");

const task = cron.schedule("* * * * *", async () => {
  try {
    const getUpdateDate = new Date();
    // getUpdateDate.setDate(getUpdateDate.getDate() - 7);

    const result = await History.updateMany(
      { createdAt: { $lt: getUpdateDate } },
      {
        isArchived: true,
        archivedAt: new Date(),
      },
    );
    console.log("Cron executed");
  } catch (err) {
    console.log(err);
  }
});
