import { Schema, model } from "mongoose";

const userSchema = new Schema({
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    refreshToken: { type: String, default: null },
})

export const User = model("User", userSchema);