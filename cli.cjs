#!/usr/bin/env node
const fs = require("node:fs");
const codec = require("./core.js");
const [mode, action, ...parts] = process.argv.slice(2);
try {
  const text = parts.length ? parts.join(" ") : fs.readFileSync(0, "utf8");
  const routes = {
    "direct:encode": () => codec.encodeDirect(text), "direct:decode": () => codec.decodeDirect(text),
    "lookup-a:encode": () => codec.encodeLookup(text, { channel: "A" }), "lookup-b:encode": () => codec.encodeLookup(text, { channel: "B" }),
    "lookup:decode": () => codec.decodeLookup(text), "utf8:encode": () => codec.encodeUtf8(text), "utf8:decode": () => codec.decodeUtf8(text)
  };
  const run = routes[`${mode}:${action}`];
  if (!run) throw new Error("Usage: node cli.cjs direct|lookup-a|lookup-b|lookup|utf8 encode|decode [text]; omitted text is read exactly from stdin.");
  const output = run();
  process.stdout.write(typeof output === "string" ? output : JSON.stringify(output, null, 2) + "\n");
} catch (error) { console.error(error.message); process.exitCode = 1; }
