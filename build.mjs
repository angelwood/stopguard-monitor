import { build } from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

async function runBuild() {
  console.log("Starting build...");

  // Ensure public directory exists
  if (!existsSync(join(ROOT, "public"))) {
    mkdirSync(join(ROOT, "public"));
  }

  // Build the app
  await build({
    entryPoints: [join(ROOT, "src/main.tsx")],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: join(ROOT, "public/bundle.js"),
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".css": "css",
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });

  // Copy static assets
  const assets = [
    "src/index.html",
    "src/styles.css",
  ];

  assets.forEach(asset => {
    const dest = asset.startsWith("src/") ? asset.replace("src/", "") : asset;
    copyFileSync(join(ROOT, asset), join(ROOT, "public", dest));
  });

  console.log("Build complete! Files are in public/");
}

runBuild().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
