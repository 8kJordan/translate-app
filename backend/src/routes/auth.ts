import { Router, Request, Response } from "express";
import { login, register, verifyEmail} from "@controllers/auth";

const router = Router();

router.post("/", login); // auth route
router.post("/register", register); // register route
router.get("/verify/:token", verifyEmail); // verification route

export default router;
