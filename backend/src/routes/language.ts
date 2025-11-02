import { Router } from "express";
import { supportedLanguages, getLanguageCode } from "@controllers/language";

const router = Router( {mergeParams: true } );

router.get("/", supportedLanguages);
router.get("/:language", getLanguageCode);

export default router;
