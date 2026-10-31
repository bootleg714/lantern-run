// Minimal ES-module bundler for pixelfx (no network, no deps): node bundle.mjs entry.js out.js
import fs from "node:fs";
import path from "node:path";

const [entry, out] = process.argv.slice(2);
const mods = new Map(); // abs path -> { id, code }

const spec = (s) => s.split(",").map((x) => x.trim()).filter(Boolean).map((x) => {
  const m = x.split(/\s+as\s+/);
  return { from: m[0], to: m[1] ?? m[0] };
});

function load(file) {
  file = path.resolve(file);
  if (mods.has(file)) return mods.get(file).id;
  const rec = { id: mods.size, code: "" };
  mods.set(file, rec);
  let src = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  const req = (p) => `__r(${load(path.resolve(dir, p))})`;
  const exportsList = []; const tail = []; const stars = [];

  src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?/gm, (_, s, p) =>
    `const {${spec(s).map((x) => (x.from === x.to ? x.from : `${x.from}: ${x.to}`)).join(", ")}} = ${req(p)};`);
  src = src.replace(/^import\s*\*\s*as\s+(\w+)\s+from\s*["']([^"']+)["'];?/gm, (_, n, p) => `const ${n} = ${req(p)};`);
  src = src.replace(/^export\s*\*\s*from\s*["']([^"']+)["'];?/gm, (_, p) => { stars.push(`__star(__e, ${req(p)});`); return ""; });
  src = src.replace(/^export\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?/gm, (_, s, p) => {
    const v = `__m${tail.length}_${rec.id}`;
    tail.push(`{ const ${v} = ${req(p)}; ${spec(s).map((x) => `__def(__e, "${x.to}", () => ${v}.${x.from});`).join(" ")} }`);
    return "";
  });
  src = src.replace(/^export\s*\{([^}]*)\};?/gm, (_, s) => { spec(s).forEach((x) => exportsList.push([x.to, x.from])); return ""; });
  src = src.replace(/^export\s+(async\s+function\*?|function\*?|class|const|let|var)\s+(\w+)/gm, (_, kw, n) => { exportsList.push([n, n]); return `${kw} ${n}`; });
  if (/^\s*(import|export)\b/m.test(src)) throw new Error("unhandled import/export in " + file);

  rec.code = `function(__e){\n${src}\n${exportsList.map(([to, from]) => `__def(__e, "${to}", () => ${from});`).join("\n")}\n${tail.join("\n")}\n${stars.join("\n")}\n}`;
  return rec.id;
}

const root = load(entry);
const list = [...mods.values()].sort((a, b) => a.id - b.id);
const js = `(()=>{const __M=[${list.map((m) => m.code).join(",\n")}];
const __C={};
function __def(e,k,g){if(!Object.prototype.hasOwnProperty.call(e,k))Object.defineProperty(e,k,{get:g,enumerable:true});}
function __star(e,m){for(const k of Object.keys(m))if(k!=="default")__def(e,k,()=>m[k]);}
function __r(i){if(__C[i])return __C[i];const e=__C[i]={};__M[i](e);return e;}
__r(${root});})();`;
fs.writeFileSync(out, js);
console.log(`bundled ${mods.size} modules, ${js.length} bytes`);
