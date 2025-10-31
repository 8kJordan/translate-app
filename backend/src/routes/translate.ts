import { Router } from "express";
import { translateText } from "@controllers/translate";

const router = Router();

router.post("/", translateText);

export default router;
