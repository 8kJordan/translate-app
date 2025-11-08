import * as zod from "zod"

export const languageCode = zod
    .string()
    .trim()
    .lowercase()
    .min(2)

export const envSchema = zod.object({
    AZURE_API_KEY: zod.string(),
    AZURE_REGION: zod.string(),
    TRANSLATION_URL: zod.url(),
});

export const translateRequest = zod.object({
    from: languageCode.optional(),
    to: languageCode,
    text: zod.string()
})