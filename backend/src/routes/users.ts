import { Router, Request, Response } from "express";
const router = Router();

router.get("/", (_req: Request, res: Response) => {
    res.json([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);
});

router.post("/", (req: Request, res: Response) => {
    const { name } = req.body;
    res.status(201).json({ message: `User ${name} created.` });
});

export default router;
