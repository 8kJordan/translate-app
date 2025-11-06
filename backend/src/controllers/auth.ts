import { Request, Response } from 'express';
import argon2 from "@node-rs/argon2";
import jwt from "jsonwebtoken";
import { loginAttempt, registerAttempt } from "@schemas/auth";
import { User } from "@db/user.model";
import { sendVerificationEmail } from "@utils/emailVerification";
import { sendTestEmail} from "@utils/testEmailVerification";
import {generateAuthTokens, setAuthCookies, generateAccessToken, setAccessToken, clearSessionCookies} from "@utils/jwt";
import { redirectTemplateSuccess, redirectTemplateFailure } from "@utils/redirectTemplate";


export const authenticate = async (req: Request, res: Response) => {
    try {
        const token = (req as any).cookies?.accessToken;

        if (!token) {
            return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
        }

        const secret = process.env.AUTH_SECRET;
        if (!secret) {
            return res.status(500).json({ status: "error", errType: "ServerError", desc: "Missing AUTH_SECRET" });
        }

        const payload = jwt.verify(token, secret) as { userId?: string }; // getting useId from jwt payload
        if (!payload?.userId) {
            return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
        }

        const user = await User.findById(payload.userId) // fetching user data

        if (!user) {
            console.log(`User ${payload.userId} does not exist, failed authentication`);
            return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
        }

        console.log(`Successfully authenticated user ${payload.userId}`);
        return res.status(200).json({
            status: "success",
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isAuthenticated: true
        });

    } catch (err) {
        return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
    }
}

export const login = async (req: Request, res: Response) => {
    const result = loginAttempt.safeParse(req.body);

    if (!result.success) {
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

    console.log(`Attempting to authenticate user ${result.data.email}`)
    try {
        // user existence verification
        const {email, password} = result.data!;
        const user = await User.findOne({email: email})

        if (!user) {
            console.log(`User ${email} does not exist, failed authentication`);
            return res.status(401).json({
                "status": "error",
                "errType": "UnauthorizedError",
                "userExists": false,
                "isAuthenticated": false,
            })
        }

        // if user has not yet verified their email, do not proceed with authentication
        if (!user!.isVerified) {
            console.log(`User ${email} has not verified their email, failed authentication`);
            return res.status(401).json({
                "status": "error",
                "errType": "UnauthorizedError",
                "isAuthenticated": false,
                "desc": "User has not verified their email"
            })
        }

        // pass verification
        const isPassValid = await argon2.verify(user!.password, password)
        if (!isPassValid) {
            console.log(`User ${email} entered an incorrect password, unauthorized request`);
            return res.status(401).json({
                "status": "error",
                "errType": "UnauthorizedError",
                "isAuthenticated": false,
            })
        }

        // issue access + refresh tokens
        const {accessToken, refreshToken} = generateAuthTokens(String(user!._id));

        // storing hashed user refresh token
        user!.refreshToken = await argon2.hash(refreshToken);
        await user!.save();

        setAuthCookies(res, accessToken, refreshToken); // setting both access and refresh tokens as cookies in response

        console.log(`Successfully authenticated user ${email}`)
        return res.status(200).json({
            status: "success",
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isAuthenticated: true,
        });

    }catch (error) {
        console.error("Authentication check failed:", error);
        res.status(500).json({
            "status": "error",
            "errType": "ServerError",
        })
    }
}

export const register = async (req: Request, res: Response) => {
    const result = registerAttempt.safeParse(req.body);

    if(!result.success) {
        console.log(result.error.message)
        return res.status(400).json({
            status: "error",
            errType: "SchemaValidationErr",
            errors: result.error!.issues.map(e => ({
                field: e.path,
                code: e.code,
                message: e.message,
            })),
            message: "Incorrect schema in request body"
        });
    }
    const {email, password, phone, firstName, lastName} = result.data!;
    console.log(`Register attempt for email: ${email}`);

    try {
        // user existence verification
        const emailExists = await User.findOne({email: email})

        if (emailExists) {
            console.log(`Registration blocked: email already in use (${email})`);
            return res.status(400).json({
                "status": "error",
                "errType": "RegistrationError",
                "userExists": true,
                "desc": "Email already in use"
            })
        }

        console.log(`Creating new user for ${email}`);
        const hashedPassword = await argon2.hash(password)
        // storing attempted user creation in DB, with the isVerified flag set to false
        const user = new User({email, password: hashedPassword, phone, firstName, lastName})
        await user.save()
        console.log(`User created with _id=${user._id} (verified=${user.isVerified})`);

        // generating email verification token
        const token = jwt.sign(
            { userId: user!._id, email },
            process.env.EMAIL_VERIFICATION_SECRET!,
            { expiresIn: process.env.EMAIL_VERIFICATION_EXPIRATION! as any}
        )
        console.log(`Generated email verification token for user _id=${user._id}`);

        let verificationUrl: string;
        if (process.env.NODE_ENV === "development"){
            verificationUrl = `http://localhost:3000/api/auth/verify/${token}`;
        } else if (process.env.NODE_ENV === "production") {
            verificationUrl = `https://group9-contacts.com/api/auth/verify/${token}`
        } else {
            return res.status(500).json({
                "status": "error",
                "errType": "ServerError",
                "desc": "Failed to create user"
            })
        }
        console.log(`Prepared verification URL for ${email} (env=${process.env.NODE_ENV})`);

        // email type to be sent depending on environment
        if (process.env.NODE_ENV == "development")
            await sendTestEmail(token);
        else
            await sendVerificationEmail({to: email, from: "noreply@group9-contacts.com"}, verificationUrl)
        console.log(`Sending verification email to ${email}`);


        console.log(`Sent verification email to ${email}`);
        res.status(200).json({
            "status": "success",
            "message": "Sent Email Verification"
        })
        console.log(`Registration flow completed for ${email}`);

    }
    catch (error) {
        console.error(`Failed to register user ${email}:`, error);
        return res.status(500).json({
            "status": "error",
            "errType": "ServerError",
            "desc": "Failed to create user"
        })
    }
}

// TODO logic looks good for the most part,
export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.params; // gathering request context

    try {
        // verifying jwt token sent by client
        const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET!) as {
            userId: string;
            email: string;
        };

        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log(`User ${decoded.email} does not exist, failed to perform verification`);
            return res.status(400).send(redirectTemplateFailure)
        }

        // if user has already verified their email return success
        if (user.isVerified) {
            console.log(`User ${user.email} has already been verified`);
            return res.status(200).send(redirectTemplateSuccess);
        }
        // generating signed access and refresh tokens
        const { accessToken, refreshToken } = generateAuthTokens(String(user._id))
        user.isVerified = true; // verify user
        user.refreshToken = await argon2.hash(refreshToken);

        await user.save(); // save user document to mongo

        setAuthCookies(res, accessToken, refreshToken); // setting both access and refresh tokens as cookies in response

        console.log(`User ${user.email} has successfully been verified`);
        return res.status(200).send(redirectTemplateSuccess);
    } catch (err) {
        console.error("Failed to verify user token: ", err)
        return res.status(401).send(redirectTemplateFailure)
    }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken

    if(!token){
        return res.status(401).json({
            "status": "error",
            "errType": "UnauthorizedError",
        })
    }

    let decoded;
    try{
        decoded = jwt.verify(token, process.env.AUTH_REFRESH_SECRET!) as {
            userId: string;
        }
    } catch (error){ // throw unauthorized err if decode fails
        console.log(`Failed to refresh access token for user`);
        return res.status(401).json({
            "status": "error",
            "errType": "UnauthorizedError",
        })
    }

    // else generate new access token
    const accessToken: string = generateAccessToken(decoded.userId);

    setAccessToken(res, accessToken); // setting the new access token to response cookies

    console.log(`Successfully refreshed access token for user ${decoded.userId}`);
    return res.status(200).json({
        "status": "success"
    })
}

export const logout = async (req: Request, res: Response) => {
    try {

        clearSessionCookies(res);
        return res.status(200).json({
            status: "success"
        });
    } catch (err) {
        return res.status(500).json({
            status: "error",
            errType: "LogoutError",
        });
    }
};
