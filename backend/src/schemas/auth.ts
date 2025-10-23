import * as zod from "zod";


const passwordSchema = zod.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[@$!%*?&]/, "Password must include at least one special character");

const emailSchema = zod
    .email()

export const loginAttempt = zod.object({
    email: emailSchema,
    password: passwordSchema,
})

