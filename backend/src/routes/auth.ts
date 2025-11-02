import { Router, Request, Response } from "express";
import {login, register, verifyEmail, refreshAccessToken, logout, authenticate} from "@controllers/auth";

const router = Router();

router.post("/", authenticate) // auth route
router.post("/login", login); // login route
router.post("/register", register); // register route
router.get("/verify/:token", verifyEmail); // verification route
router.post("/refresh", refreshAccessToken); // refresh access token route
router.get("/logout", logout);

export default router;
