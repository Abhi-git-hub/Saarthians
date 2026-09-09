import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    // eslint-plugin-react's version auto-detection calls a context API
    // removed in ESLint 10 and crashes every file. Pinning the version
    // (matching package.json) avoids the detector without touching rules.
    settings: { react: { version: "19.2.8" } },
  },
]);
