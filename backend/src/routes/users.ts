import { Router, Request, Response } from "express";
import {getUserProfile, listUserTranslations} from "@controllers/user";
import { requireAuth } from "@utils/authMiddleware";

const router = Router();
router.use(requireAuth);

router.get("/:userEmail", getUserProfile);
router.get("/:userEmail/translations", listUserTranslations)


export default router;
