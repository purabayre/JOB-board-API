const cron = require("node-cron");
const History = require("../models/history");

const task = cron.schedule("*/10 * * * * *", async () => {
  try {
    const getUpdateDate = new Date();

    const result = await History.updateMany(
      { isArchived: true },
      {
        $set: {
          archivedAt: getUpdateDate,
        },
      },
    );

    console.log("Cron executed");
  } catch (err) {
    console.log(err);
  }
});
