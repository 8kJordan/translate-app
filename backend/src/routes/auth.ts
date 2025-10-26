import { Router, Request, Response } from "express";
import { login, register, verifyEmail, refreshAccessToken, logout} from "@controllers/auth";

const router = Router();

router.post("/", login); // auth route
router.post("/register", register); // register route
router.get("/verify/:token", verifyEmail); // verification route
router.post("/refresh", refreshAccessToken); // refresh access token route
router.get("/logout", logout);

export default router;
