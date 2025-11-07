
function getRedirects(){
    return {
        redirectUrl: process.env.NODE_ENV !== 'production' ? "http://localhost:5173/" : "https://group9-contacts.com/",
        autoRedirectPath: process.env.NODE_ENV !== 'production' ? "http://localhost:5173/" : "/"
    }
}


export const redirectTemplateSuccess: string = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="3;url=${getRedirects().autoRedirectPath}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email Verified</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top, #f8fafc, #e2e8f0);
        color: #0f172a;
      }
      main {
        max-width: 22rem;
        padding: 2.5rem 2rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.94);
        border-radius: 1.5rem;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
        backdrop-filter: blur(12px);
      }
      h1 {
        margin: 0.75rem 0 0.25rem;
        font-size: 1.4rem;
      }
      p {
        margin: 0.25rem 0;
        line-height: 1.5;
      }
      .icon {
        font-size: 2.5rem;
      }
      a {
        color: #2563eb;
        font-weight: 600;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="icon">✅</div>
      <h1>Email successfully verified!</h1>
      <p>Redirecting you...</p>
      <p>
        Not redirected yet?
        <a href="${getRedirects().redirectUrl}">Click here</a>.
      </p>
    </main>
  </body>
</html>
`;

export const redirectTemplateFailure: string = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="3;url=${getRedirects().autoRedirectPath}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email Verification Failed</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top, #f8fafc, #e2e8f0);
        color: #0f172a;
      }
      main {
        max-width: 22rem;
        padding: 2.5rem 2rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.94);
        border-radius: 1.5rem;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
        backdrop-filter: blur(12px);
      }
      h1 {
        margin: 0.75rem 0 0.25rem;
        font-size: 1.4rem;
      }
      p {
        margin: 0.25rem 0;
        line-height: 1.5;
      }
      .icon {
        font-size: 2.5rem;
      }
      a {
        color: #2563eb;
        font-weight: 600;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="icon">❌</div>
      <h1>Email verification failed</h1>
      <p>Redirecting you...</p>
      <p>
        Not redirected yet?
        <a href="${getRedirects().redirectUrl}">Click here</a>.
      </p>
    </main>
  </body>
</html>
`;
