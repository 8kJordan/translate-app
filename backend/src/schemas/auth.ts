import * as zod from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";


const passwordSchema = zod.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[@$!%*?&]/, "Password must include at least one special character");

const emailSchema = zod
    .email();

const phoneSchema = zod
    .string()
    .trim()
    // parsing and normalizing user sent registration number
    .transform((value, ctx) => {
        const phone = parsePhoneNumberFromString(value, "US");
        if (!phone || !phone.isValid()) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: "Invalid phone number",
                fatal: true

            })
            return zod.NEVER
        }
        return phone.number; // normalized E.164 format (+14075551234)
    });

const firstNameSchema = zod
    .string()
    .trim()
    .max(50, "First name cannot be longer than 50 characters long");

const lastNameSchema = zod
    .string()
    .trim()
    .max(50, "Last name cannot be longer than 50 characters long");


export const loginAttempt = zod.object({
    email: emailSchema,
    password: passwordSchema,
});

export const registerAttempt = zod.object({
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    firstName: firstNameSchema,
    lastName: lastNameSchema,
});
