import sgMail from "@sendgrid/mail";
import { VerificationEmailTemplate } from "@utils/emailTemplate"


export function sendgridConnect(){
    const apiKey = process.env.SENDGRID_API_KEY

    if (!apiKey) {
        console.error("Missing Sendgrid API key, cannot perform email verification");
        throw new Error("Missing Sendgrid API key, cannot perform email verification");
    }
    sgMail.setApiKey(apiKey);
}

export interface SendEmailOptions {
    to: string;
    from: string;
}

export async function sendVerificationEmail(opts: SendEmailOptions, verificationUrl: string): Promise<void> {

    const {subject, text, html} = VerificationEmailTemplate.verification(verificationUrl);
    const email = {
        to: opts.to,
        from: opts.from,
        subject: subject,
        text: text,
        html: html,
    };

    try {
        const response = await sgMail.send(email);
        console.log('Email sent:', response[0].statusCode, response[0].headers);
    } catch (error) {
        console.error('Error sending email:', error);
        if ((error as any).response) {
            console.error((error as any).response.body);
        }
        throw error;
    }
}
