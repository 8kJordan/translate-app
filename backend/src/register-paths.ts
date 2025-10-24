import path from "path";
import { register } from "tsconfig-paths";

// Register runtime path aliases for compiled JS in dist
register({
  baseUrl: path.resolve(__dirname), // points to dist at runtime
  paths: {
    "@schemas/*": ["schemas/*"],
    "@routes/*": ["routes/*"],
    "@controllers/*": ["controllers/*"],
    "@db/*": ["db/*"],
    "@utils/*": ["utils/*"],
  },
});

