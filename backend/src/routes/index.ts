import { Request, Response, Router } from "express";
import usersRouter from "./users";
import authRouter from "./auth";
import translateRouter from "./translate";
import languageRouter from "./language";

const router = Router();


router.use("/auth", authRouter); // authentication endpoint
router.use("/translate", translateRouter); // translation endpoint
router.use("/languages", languageRouter); // language endpoint
// router.use("/:userEmail", usersRouter); // user endpoint


export default router;
