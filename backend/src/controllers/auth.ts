import { Request, Response } from 'express';
import { loginAttempt } from "@schemas/auth"

// TODO continue following auth guide to set up auth with JWTs for API sesh management
// TODO continue setting up schemas and learning zod
// TODO lets also set up trusted user devices and all of that

export const login = (req: Request, res: Response): void =>{
    const result = loginAttempt.safeParse(req.body);

    if(!result.success) {
        console.log(result.error.message)
        res.status(400).json({
            "status": "error",
            "errType": "SchemaValidationErr",
            "errors": result.error!.issues.map(e => ({
                field: e.path,
                code: e.code,
                message: e.message,
            })),
            "message": "Incorrect schema in request body"
        });
    } else {
        res.status(200).json({
            "status": "success"
        })
    }
}