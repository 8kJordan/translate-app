import app from "./app";
import { dbConnect } from "@db/connection";
import { sendgridConnect } from "@utils/emailVerification";
import dotenv from "dotenv";

// fetching envs
dotenv.config();

// initializing connections
(async () => {
    await dbConnect();
    sendgridConnect();
})();


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
