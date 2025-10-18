import { Router, Request, Response } from "express";
const router = Router();

router.post("/login", (req: Request, res: Response) => {
    const { username } = req.body;
    res.json({ token: `fake-jwt-for-${username}` });
});

export default router;
