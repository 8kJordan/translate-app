import { Router } from "express";
import usersRouter from "./users";
import authRouter from "./auth";

const router = Router();

// Mount individual route modules
router.use("/user", usersRouter);
router.use("/auth", authRouter);


// Default root route
router.get("/", (_req, res) => {
    res.json({ message: "Welcome to the API root" });
});

export default router;
