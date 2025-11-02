import { Router } from "express";
import { requireAuth } from "@utils/authMiddleware"
import { translateText } from "@controllers/translate";

const router = Router();

router.use(requireAuth); // requiring authenticated token for these API's

router.post("/", translateText);
export default router;
