import * as zod from "zod";


const passwordSchema = zod.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[@$!%*?&]/, "Password must include at least one special character");

const usernameSchema = zod.string()
    .min(6, "Username must be at least 6 characters long")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .refine((value) => !/^\d+$/.test(value), {
        message: "Username cannot be only numbers",
    })
    .refine((value) => !/[@$!%*?&]/.test(value), {
        message: "Username cannot contain special characters like @$!%*?&",
    });

export const loginAttempt = zod.object({
    username: usernameSchema,
    password: passwordSchema,
})

