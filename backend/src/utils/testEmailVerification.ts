import nodemailer from "nodemailer";

// Utility function to create an Ethereal transporter and send a test email
export async  function sendTestEmail(token: string) {
    await createAndSendEmail(token).catch(console.error);
}

async function createAndSendEmail(token: string) {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    const info = await transporter.sendMail({
        from: '"MyApp" <no-reply@myapp.com>',
        to: "you@example.com",
        subject: "Test Verification Email",
        html: `<p>Click <a href="http://localhost:3000/api/auth/verify/${token}">here</a> to verify.</p>`,
    });

    console.log("✅ Preview ***test*** email here:", nodemailer.getTestMessageUrl(info));
}