import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import apiRouter from "@routes/index";
import { isDbAvailable } from "@db/connection";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// middleware for bad JSON
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            status: "error",
            errType: "BadRequestError",
            desc: "Bad JSON in request body"
        });
    }
    return res.status(500).json({
        status: "error",
        errType: "ServerError"
    });
});

// Routes
app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
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
