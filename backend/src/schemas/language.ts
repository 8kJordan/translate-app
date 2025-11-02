import * as zod from "zod"

export const languageParam = zod.object({ // correctly pre-process language name before searching it
    language: zod.preprocess((v) => {
        if (typeof v !== "string") return v

       return v
           .toLowerCase()
           .trim()
           .split(/\s+/)
           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
           .join(" ")
    }, zod.string())
});