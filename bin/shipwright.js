#!/usr/bin/env node
import { runCli } from "../src/cli.js";

const exitCode = await runCli({
  argv: process.argv.slice(2),
  cwd: process.cwd()
});

process.exitCode = exitCode;
