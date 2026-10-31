// Build index.html: bundle src/main.js with pixelfx and inline it with the art into template.html.
// Usage (from the repo root): node game/build.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.join(here, "game.js");
execFileSync(process.execPath, [path.join(here, "bundle.mjs"), path.join(here, "src", "main.js"), bundle], { stdio: "inherit" });

const template = fs.readFileSync(path.join(here, "template.html"), "utf8");
const game = fs.readFileSync(bundle, "utf8");
const art = fs.readFileSync(path.join(here, "art.json"), "utf8");
if (game.includes("</script") || art.includes("</script")) throw new Error("a bundle contains </script");

const out = template.replace("/*ART*/null", () => art).replace("/*GAME*/", () => game);
fs.writeFileSync(path.join(here, "..", "index.html"), out);
fs.rmSync(bundle);
console.log("wrote index.html", Math.round(out.length / 1024), "KB");
