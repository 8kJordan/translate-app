import type { Request, Response } from "express";

interface TranslateRequestBody {
    text?: unknown;
    to?: unknown;
    from?: unknown;
}

const normalizeTargets = (input: unknown): string[] | null => {
    if (typeof input === "string" && input.trim().length > 0) {
        return [input.trim()];
    }

    if (Array.isArray(input)) {
        const targets = input
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0);

        return targets.length > 0 ? targets : null;
    }

    return null;
};

export const translateText = async (req: Request, res: Response) => {
    const { text, to, from }: TranslateRequestBody = req.body ?? {};
    const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
    const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;

    if (typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({
            status: "error",
            message: "A non-empty 'text' field must be provided in the request body.",
        });
    }

    const targets = normalizeTargets(to);

    if (!targets) {
        return res.status(400).json({
            status: "error",
            message: "At least one target language must be provided in the 'to' field.",
        });
    }

    if (!AZURE_TRANSLATOR_ENDPOINT || !AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION) {
        return res.status(500).json({
            status: "error",
            message: "Translation service is not configured properly.",
        });
    }

    try {
        const baseUrl = AZURE_TRANSLATOR_ENDPOINT.endsWith("/")
            ? AZURE_TRANSLATOR_ENDPOINT
            : `${AZURE_TRANSLATOR_ENDPOINT}/`;

        const url = new URL("translate", baseUrl);
        url.searchParams.append("api-version", "3.0");
        targets.forEach((target) => url.searchParams.append("to", target));

        if (typeof from === "string" && from.trim().length > 0) {
            url.searchParams.append("from", from.trim());
        }

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
                "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([
                {
                    Text: text,
                },
            ]),
        });

        const responseBody = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                status: "error",
                message: "Azure Translation API request failed.",
                details: responseBody,
            });
        }

        return res.status(200).json({
            status: "success",
            data: responseBody,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Unexpected error while requesting the translation service.",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
