import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    refreshToken: { type: String, required: true },
})

export const User = model("User", userSchema);