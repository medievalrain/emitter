import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	platform: "neutral",
	cjsDefault: false,
	shims: false,
	dts: true,
});
