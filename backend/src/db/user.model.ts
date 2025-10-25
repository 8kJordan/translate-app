import { Schema, model } from "mongoose";
import { TIME } from "@utils/constants"

const userSchema = new Schema({
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    refreshToken: { type: String, default: null },
    },
    {timestamps: true})

// expire db entry in 24 hours if email verification was not complete
if (process.env.NODE_ENV === "production") { // if in prod, user will be wiped in 24 hour
    userSchema.index(
        { createdAt: 1},
        { expireAfterSeconds: TIME.hToS(24), partialFilterExpression: { isVerified: false }}
    )
} else{
    userSchema.index(
        { createdAt: 1},
        { expireAfterSeconds: TIME.mToS(5), partialFilterExpression: { isVerified: false }}
    )
}


export const User = model("User", userSchema);