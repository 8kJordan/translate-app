import { Response } from "express";
import zod from "zod";
import { AuthedRequest } from "@utils/authMiddleware";
import { translateRequest, envSchema } from "@schemas/translate";
import { validationError } from "@utils/errors";
import { Translation } from "@db/translation.model";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";


function getEnvs(){
    return envSchema.parse(process.env);
}

interface TranslationRequest {
    text: string
}
interface IndividualTranslation {
    translations: {
        text: string;
        to: string;
    }[];
}

type TranslationResponse = IndividualTranslation[];

async function requestTranslation(envs: zod.infer<typeof envSchema>, reqBody: zod.infer<typeof translateRequest>) {

    return axios.post<TranslationResponse>(
        `${envs.TRANSLATION_URL}/translate`,
        [
            {
                text: reqBody.text,
            },
        ],
        {
            headers: {
                "Ocp-Apim-Subscription-Key": envs.AZURE_API_KEY,
                "Ocp-Apim-Subscription-Region": envs.AZURE_REGION,
                "Content-Type": "application/json",
                "X-ClientTraceId": uuidv4().toString(),
            },
            params: {
                "api-version": "3.0",
                from: reqBody.from,
                to: reqBody.to,
            },
            responseType: "json",
        }
    );

}

export const translateText = async (req: AuthedRequest, res: Response) => {
    let envs;
    try {
        envs = getEnvs();
    } catch (e) {
        console.error("Failed to load environment variables for /translate endpoint");
        return res.status(500).json({
            status: "error",
            errType: "ServerError",
            desc: "Failed to translate text"
        })
    }
    console.log(`Translation attempt for user ${req.userId}`);

    const reqBody = translateRequest.safeParse(req.body);

    if (!reqBody.success) {
        console.log(reqBody.error.message)
        return validationError(res, reqBody.error.issues)
    }

    let response;
    try{
        // making translation API request
        response = await requestTranslation(envs, reqBody.data);
    } catch (err: any) {

        if ( err.response && err.response.status >= 400 && err.response.status <= 499) {
            console.log("Failed to query translation API due to a BadRequestError", err.response.data.error.message);

            return res.status(400).json({
                status: "error",
                errType: "BadRequestError",
                desc: err.response.data.error.message
            })
        }

        console.error("Failed to query translation API", err);
        return res.status(500).json({
            status: "error",
            errType: "ServerError",
            desc: "Failed to translate text"
        })
    }

    try {
        const translatedText = response.data[0].translations[0].text // will have one translation per request

        const translation = new Translation({
            user: req.userId,
            sourceText: reqBody.data.text,
            translatedText: translatedText,
            from : reqBody.data.from,
            to: reqBody.data.to
        })
        await translation.save()
        console.log(`Successfully stored translation for user ${req.userId}`);

        return res.status(200).json({
            status: "success",
            sourceText: reqBody.data.text,
            translatedText: translatedText,
            from: reqBody.data.from,
            to: reqBody.data.to
        })

    } catch (err){
        console.log("Failed save translation and return translated text", err)
        return res.status(500).json({
            status: "error",
            errType: "ServerError",
            desc: "Failed to translate text"
        })
    }

};
