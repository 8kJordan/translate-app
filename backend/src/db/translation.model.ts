import { Schema, model, Types } from "mongoose";

const translationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", index: true, required: true },
    sourceText: { type: String, required: true },
    translatedText: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  { timestamps: true }
);

export const Translation = model("Translation", translationSchema);

