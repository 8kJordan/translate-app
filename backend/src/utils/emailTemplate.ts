
export const VerificationEmailTemplate = {
    verification: (verifyUrl: string) => ({
        subject: "Verify your translate account",
        text: `Welcome to translator! Please verify your email: ${verifyUrl}`,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#333;">Welcome to <span style="color:#007BFF;">MyApp</span> 🎉</h2>
        <p style="font-size:16px;color:#444;">
          Thanks for signing up! Please verify your email address to activate your account.
        </p>
        <p style="text-align:center;margin:30px 0;">
          <a href="${verifyUrl}"
             style="background-color:#007BFF;color:#fff;padding:12px 24px;
             text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
             Verify Email
          </a>
        </p>
        <p style="color:#555;font-size:14px;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="font-size:13px;color:#007BFF;word-break:break-all;">${verifyUrl}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="font-size:12px;color:#888;">
          This link will expire in 1 hour. If you didn’t create an account, you can safely ignore this email.
        </p>
      </div>
    `,
    }),
};
