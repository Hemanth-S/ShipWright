import { initializeWorkspace } from "./project-initialization.js";
import { profileRepository } from "./repository-profile.js";
import { continueWorkingBackwards, generateOpenSpec } from "./working-backwards.js";
import { generateEvidenceReport } from "./report-readiness.js";

const USAGE = `Usage:
  shipwright init [--repo-root <path>] [--target-path <path>] [--remote <url>] [--json]
  shipwright profile [--repo-root <path>] [--json]
  shipwright clarify --feature <text> [--repo-root <path>] [--all-topics-answered] [--confirmed] [--json]
  shipwright spec --capability <slug> --feature <text> [--repo-root <path>] [--json]
  shipwright report [--repo-root <path>] [--json]
  shipwright help`;

/**
 * Runs a Shipwright CLI command.
 *
 * @param {{ argv: string[], cwd: string, stdout?: { write(text: string): void }, stderr?: { write(text: string): void } }} options - CLI runtime options.
 * @returns {Promise<number>} Process exit code.
 */
export async function runCli(options) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const [command, ...rawArgs] = options.argv;

  try {
    if (!command || command === "help" || command === "--help" || command === "-h") {
      stdout.write(`${USAGE}\n`);
      return 0;
    }

    const args = parseArgs(rawArgs);
    const repoRoot = args.repoRoot ?? options.cwd;
    const result = await runCommand(command, args, repoRoot);
    writeResult(stdout, result, args.json);
    return result.exitCode ?? 0;
  } catch (error) {
    stderr.write(`${error.message}\n\n${USAGE}\n`);
    return 1;
  }
}

async function runCommand(command, args, repoRoot) {
  if (command === "init") {
    return initializeWorkspace({
      repoRoot,
      targetPath: args.targetPath,
      remote: args.remote
    });
  }

  if (command === "profile") {
    return profileRepository({ repoRoot });
  }

  if (command === "clarify") {
    requireOption(args.feature, "--feature is required for clarify");
    return continueWorkingBackwards({
      repoRoot,
      featureRequest: args.feature,
      allTopicsAnswered: args.allTopicsAnswered === true,
      confirmed: args.confirmed === true
    });
  }

  if (command === "spec") {
    requireOption(args.capability, "--capability is required for spec");
    requireOption(args.feature, "--feature is required for spec");
    return generateOpenSpec({
      repoRoot,
      capability: args.capability,
      featureRequest: args.feature,
      confirmed: true
    });
  }

  if (command === "report") {
    return generateEvidenceReport({ repoRoot });
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseArgs(rawArgs) {
  const args = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const name = toCamelCase(arg.slice(2));
    if (["json", "allTopicsAnswered", "confirmed"].includes(name)) {
      args[name] = true;
      continue;
    }

    const value = rawArgs[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${arg} requires a value`);
    }
    args[name] = value;
    index += 1;
  }

  return args;
}

function writeResult(stdout, result, json) {
  if (json) {
    stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  if (result.message) {
    stdout.write(`${result.message}\n`);
    return;
  }

  if (result.specPath) {
    stdout.write(`OpenSpec written to ${result.specPath}\n`);
    return;
  }

  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function requireOption(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}
