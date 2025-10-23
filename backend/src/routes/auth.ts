import { Router, Request, Response } from "express";
import { login } from "@controllers/auth";

const router = Router();

router.post("/", login); // auth route

export default router;
