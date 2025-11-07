import { Request, Response, Router } from "express";
import usersRouter from "./users";
import authRouter from "./auth";
import translateRouter from "./translate";
import languageRouter from "./language";
import docsRouter from "../docs";


const router = Router();


router.use("/auth", authRouter); // authentication endpoint
router.use("/translate", translateRouter); // translation endpoint
router.use("/languages", languageRouter); // language endpoint
router.use("/docs", docsRouter); // swagger documentation
// router.use("/:userEmail", usersRouter); // user endpoint


export default router;
