import mongoose from "mongoose";

export async function dbConnect() {
    const uri = process.env.MONGO_URI!;
    try {
        await mongoose.connect(uri);
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB", (error as Error).message);
        throw error;
    }
}

export function isDbAvailable(): boolean {
    return mongoose.connection.readyState == 1;
}
