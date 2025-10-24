import express, { Application } from "express";
import cookieParser from "cookie-parser";
import apiRouter from "@routes/index";
import { isDbAvailable } from "@db/connection";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api", (req, res, next) => {
    if (!isDbAvailable()) {
        return res.status(500).json({
            status: "error",
            errType: "ServerError",
        });
    }
    return next();
}, apiRouter);

// 404 fallback in case no routes are matched
app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
});

export default app;
