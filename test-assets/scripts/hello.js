#!/usr/bin/env node
/**
 * BigDeck "run script" test — node.
 *
 * Appends a timestamped line to ran.log next to this file (BigDeck runs
 * scripts detached with stdout discarded, so the log is the proof).
 */

const fs = require("fs");
const path = require("path");

const here = __dirname;
const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
const args = process.argv.slice(2).join(" ");

fs.appendFileSync(
  path.join(here, "ran.log"),
  `${stamp} | node   | pid=${process.pid} | args: ${args}\n`,
);

console.log("hello from BigDeck (node) — logged to ran.log");
