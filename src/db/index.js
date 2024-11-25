import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI,{
            dbName: DB_NAME 
        })
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
    }
    catch (error) {
        console.error("MongoDB connection failed",`${process.env.MONGODB_URI}/${DB_NAME}`, error)
        // Node.js provides a global `process` object that represents the running process of the application.
        // The `process.exit(code)` method is used to terminate the Node.js process explicitly.
        // Passing `1` as the exit code indicates that the process is exiting due to an error or failure.
        // Commonly used in scenarios where critical issues occur, requiring the application to stop.
        process.exit(1);
        // or we can threw error
    }
}
export default connectDB;