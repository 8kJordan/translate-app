import express, { Application } from "express";
import apiRouter from "./routes/index";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api", apiRouter);

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
});

export default app;
