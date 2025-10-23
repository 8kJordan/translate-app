import { Request, Response } from 'express';
import argon2 from "@node-rs/argon2";
import jwt from "jsonwebtoken";
import { loginAttempt } from "@schemas/auth";
import { User } from "@db/user.model";

// TODO auth looks like it works, onto registration and if we have time, jwt auth endpoint
// TODO test endpoint tmr when we register users lol
export const login = async (req: Request, res: Response) =>{
    const result = loginAttempt.safeParse(req.body);

    if(!result.success) {
        console.log(result.error.message)
        return res.status(400).json({
            "status": "error",
            "errType": "SchemaValidationErr",
            "errors": result.error!.issues.map(e => ({
                field: e.path,
                code: e.code,
                message: e.message,
            })),
            "message": "Incorrect schema in request body"
        });

    }

    try {
        // user existence verification
        const {email, password} = result.data!;
        const user = await User.findOne({email: email})

        if (!user){
            res.status(401).json({
                "status": "error",
                "errType": "AuthenticationError",
                "userExists": false,
                "isAuthenticated": false,
            })
        }

        // pass verification
        const isPassValid = await argon2.verify(password, user!.password)
        if (!isPassValid){
            res.status(401).json({
                "status": "error",
                "errType": "AuthenticationError",
                "isAuthenticated": false,
            })
        }

        // generating short-term access token for authe'd user
        const accessToken = jwt.sign(
            { userId: user!._id },
            process.env.AUTH_SECRET!,
            { expiresIn: process.env.AUTH_SECRET_EXPIRATION as any}
        )

        // updating refresh token
        const refreshToken = jwt.sign(
            { userId: user!._id },
            process.env.AUTH_REFRESH_SECRET!,
            { expiresIn: process.env.AUTH_REFRESH_EXPIRATION as any}
        );

        // storing hashed user refresh token
        user!.refreshToken = await argon2.hash(refreshToken);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true or false depending on .env
            maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
            sameSite: "strict", // superficial CSRF protection, need csrf tokens
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true or false depending on .env
            maxAge: 24 * 60 * 60 * 1000,  // 24 hours is milliseconds
            sameSite: "strict", // superficial CSRF protection, need csrf tokens
        });
    }
    catch (error) {
        console.error("Authentication check failed:", error);
        res.status(500).json({
            "status": "error",
            "errType": "ServerError",
        })
    }
}