// Usage: node fix_events_full.js

const mongoose = require("mongoose");

const MONGODB_URI =
  "mongodb+srv://myadmin:adminpassword@anubhavs-cluster.uxmbt5j.mongodb.net/pesu-connect-data";

const eventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model("Event", eventSchema, "events");

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Unset domains field everywhere
  const unsetResult = await Event.updateMany({}, { $unset: { domains: "" } });
  console.log(`Unset domains field in ${unsetResult.modifiedCount} events`);

  // Now set domains: [] everywhere
  const setResult = await Event.updateMany({}, { $set: { domains: [] } });
  console.log(`Set domains: [] in ${setResult.modifiedCount} events`);

  // Fix club: set to default if missing, missing slug, or slug is empty
  const resultClub = await Event.updateMany(
    {
      $or: [
        { club: { $exists: false } },
        { "club.slug": { $exists: false } },
        { "club.slug": "" },
        { club: null },
      ],
    },
    {
      $set: {
        club: {
          name: "Robotics & Automation Club",
          slug: "robotics-automation-club",
        },
      },
    },
  );
  console.log(
    `Updated ${resultClub.modifiedCount} events to ensure valid club`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
