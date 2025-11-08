import { Router, Request, Response } from "express";
import {getUserProfile, listUserTranslations, searchUserTranslations} from "@controllers/user";
import { requireAuth } from "@utils/authMiddleware";

const router = Router();
router.use(requireAuth);

router.get("/:userEmail", getUserProfile);
router.get("/:userEmail/translations", listUserTranslations)
router.post("/:userEmail/translations/search", searchUserTranslations)


export default router;
