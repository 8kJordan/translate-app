import { Router } from "express";
import usersRouter from "./users";
import authRouter from "./auth";
import translateRouter from "./translate";

const router = Router();

// Mount individual route modules
router.use("/user", usersRouter);
router.use("/auth", authRouter);
router.use("/translate", translateRouter);


// Default root route
router.get("/", (_req, res) => {
    res.json({ message: "Welcome to the API root" });
});

export default router;
