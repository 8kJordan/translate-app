import { NextFunction, Response, Router } from "express";
import fs from "fs";
import path from "path";
import { AuthedRequest, requireAuth } from "@utils/authMiddleware";

const docsRouter = Router();

const whitelistEnv = process.env.DOCS_USER_WHITELIST ?? "";
const whitelist = new Set(
  whitelistEnv
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
);

function enforceWhitelist(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ status: "error", errType: "UnauthorizedError" });
  }

  if (whitelist.size === 0) {
    return res.status(403).json({ status: "error", errType: "ForbiddenError", desc: "Docs access disabled" });
  }

  if (!whitelist.has(req.userId)) {
    return res.status(403).json({ status: "error", errType: "ForbiddenError", desc: "User is not allowed to view docs" });
  }

  return next();
}

docsRouter.use(requireAuth, enforceWhitelist);

const swaggerPathCandidates = [
  path.join(__dirname, "swagger.yaml"),
  path.join(process.cwd(), "src", "docs", "swagger.yaml")
];

const swaggerPath = swaggerPathCandidates.find((candidate) => fs.existsSync(candidate)) ?? swaggerPathCandidates[0];

docsRouter.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
<div id="swagger"></div>

<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
    window.onload = () => {
        SwaggerUIBundle({
            url: "swagger.yaml",
            dom_id: "#swagger",
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis],
            layout: "BaseLayout"
        });
    }
</script>
</body>
</html>`);
});

docsRouter.get("/swagger.yaml", (_req, res, next) => {
  res.sendFile(swaggerPath, (err) => {
    if (err) {
      next(err);
    }
  });
});

export default docsRouter;
