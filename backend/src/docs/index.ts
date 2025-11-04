import { Router } from "express";
import fs from "fs";
import path from "path";

const docsRouter = Router();

const swaggerPathCandidates = [
    path.join(__dirname, "swagger.yaml"),
    path.join(__dirname, "docs", "swagger.yml"),
    path.join(process.cwd(), "src", "docs", "swagger.yaml")
];

const swaggerPath = swaggerPathCandidates.find((candidate) => fs.existsSync(candidate)) ?? swaggerPathCandidates[0];

// serving formatted swagger hub docs
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
            url: "/api/docs/swagger.yaml",
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