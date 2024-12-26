import cron from "node-cron";
import { User } from "../models/user.model.js"


// Schedule job to run every day at midnight
cron.schedule("0 0 * * *", async () => {
    try {
        const now = new Date();

        // Find and delete users whose deletion date has passed
        const result = await User.deleteMany({ deletionDate: { $lte: now } });

        // Log the number of users deleted
        if (result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} users whose deletion dates had passed.`);
        } else {
            console.log("No users to delete.");
        }
    } catch (error) {
        console.error("Error deleting users:", error);
    }
});
