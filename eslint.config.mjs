import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Generated deployment output is never source: Next's own preset ignores
  // .next/, and .open-next/ is the OpenNext/Cloudflare build directory.
  { ignores: [".open-next/**"] },
  ...nextVitals,
  {
    // Pin the React version explicitly so eslint-plugin-react never needs
    // its auto-detection path, without touching any rules.
    settings: { react: { version: "19.2.8" } },
  },
]);
