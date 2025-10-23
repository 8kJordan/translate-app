import app from "./app";
import { dbConnect, isDbAvailable } from "@db/connection";
import dotenv from "dotenv";

// fetching envs
dotenv.config();

// initializing db connection
(async () => {
    await dbConnect();
})();


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
