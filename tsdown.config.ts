import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "node",
  cjsDefault: false,
  shims: false,
  dts: true,
});
