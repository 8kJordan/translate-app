import { Request, Response } from 'express';
import argon2 from "@node-rs/argon2";
import jwt from "jsonwebtoken";
import { loginAttempt, registerAttempt } from "@schemas/auth";
import { User } from "@db/user.model";
import { sendVerificationEmail } from "@utils/emailVerification";
import { sendTestEmail} from "@utils/testEmailVerification";
import { generateAuthTokens, setAuthCookies } from "@utils/jwt";
import * as process from "node:process";



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
                "errType": "AuthenticationError",
                "userExists": false,
                "isAuthenticated": false,
            })
        }

        // if user has not yet verified their email, do not proceed with authentication
        if (!user!.isVerified) {
            console.log(`User ${email} has not verified their email, failed authentication`);
            return res.status(401).json({
                "status": "error",
                "errType": "AuthenticationError",
                "isAuthenticated": false,
                "desc": "User has not verified their email"
            })
        }

        // pass verification
        const isPassValid = await argon2.verify(user!.password, password)
        if (!isPassValid) {
            return res.status(401).json({
                "status": "error",
                "errType": "AuthenticationError",
                "isAuthenticated": false,
            })
        }

        // issue access + refresh tokens
        const {accessToken, refreshToken} = generateAuthTokens(String(user!._id));

        // storing hashed user refresh token
        user!.refreshToken = await argon2.hash(refreshToken);
        await user!.save();

        setAuthCookies(res, accessToken, refreshToken); // setting both access and refresh tokens as cookies in response

        return res.status(200).json({
            "status": "success",
            "isAuthenticated": true,
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
            verificationUrl = `http://group9-contacts.com/api/auth/verify/${token}` // TODO change to https when it is set up
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
            return res.status(400).json({
                "status": "error",
                "errType": "VerificationError",
                "userExists": false,
                "isVerified": false,
                "desc": "User not found"
            });
        }

        // if user has already verified their email return success
        if (user.isVerified) {
            console.log(`User ${user.email} has already been verified`);
            return res.status(200).json({
                "status": "success",
                "userExists": true,
                "isVerified": true,
            });
        }
        // generating signed access and refresh tokens
        const { accessToken, refreshToken } = generateAuthTokens(String(user._id))
        user.isVerified = true; // verify user
        user.refreshToken = await argon2.hash(refreshToken);

        await user.save(); // save user document to mongo

        setAuthCookies(res, accessToken, refreshToken); // setting both access and refresh tokens as cookies in response

        console.log(`User ${user.email} has successfully been verified`);
        res.status(200).json({ // return successful response
            "status": "success",
            "userExists": true,
            "isVerified": true,
        });
    } catch (err) {
        console.error("Failed to verify user token: ", err)
        res.status(400).json({
            "status": "error",
            "errType": "InvalidTokenError",
            "desc": "Invalid or expired token"
        });
    }
};
