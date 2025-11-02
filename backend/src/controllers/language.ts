import {Request, Response} from "express";
import { languageParam } from "@schemas/language";
import { validationError } from "@utils/errors";
import axios from "axios";


interface AzureLanguage {
    name: string;
    nativeName: string;
    dir: "ltr" | "rtl";
}

interface AzureLanguagesResponse {
    translation: Record<string, AzureLanguage>;
}

export const supportedLanguages = async (req: Request , res: Response) => {
    console.log("Attempting to fetch supported languages from /api/languages endpoint")
    const url = process.env.TRANSLATION_URL
    if (!url) {
        console.error("")
        return res.status(500).json({
            status: "error",
            errType: "ServerError"
        })
    }

    const endpoint: string = `${url}/languages`

    try {
        const azureRes = await axios.get<AzureLanguagesResponse>(endpoint, {
            params: { "api-version": "3.0" }
        })

        console.log("Successfully retrieved supported languages from /api/languages endpoint")
        return res.status(200).json({
            status: "success",
            supportedLanguages: azureRes.data?.translation
        })
    } catch (err) {
        return res.status(500).json({
            status: "error",
            errType: "ServerError"
        })
    }
}

export const getLanguageCode = async (req: Request, res: Response) => {

    const params = languageParam.safeParse(req.params);
    if (!params.success) {
        return validationError(res, params.error.issues);
    }

    console.log(`Getting language code for ${params.data.language}`);

    const url = process.env.TRANSLATION_URL;
    const endpoint: string = `${url}/languages`
    try {
        const azureRes = await axios.get<AzureLanguagesResponse>(endpoint, {
            params: {"api-version": "3.0"}
        })

        // looping through all supported languages to return accurate language code
        for (const [code, info] of Object.entries(azureRes.data.translation)) {
            if (info.name === params.data.language) {
                return res.status(200).json({
                    status: "success",
                    code: code,
                })
            }
        }
    }
    catch (err){
        return res.status(500).json({
            status: "error",
            errType: "ServerError"
        })
    }

}