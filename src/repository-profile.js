import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Builds a lightweight profile for a repository.
 *
 * @param {{ repoRoot: string, selectedRepoRoot?: string, readGitMetadata?: () => Promise<{ exitCode: number }> }} options - Repository profiling options.
 * @returns {Promise<{ exitCode?: number, message?: string, deepScan?: boolean, warnings?: string[] }>} Profile result.
 */
export async function profileRepository(options) {
  const startedAt = Date.now();
  const repoRoot = path.resolve(options.repoRoot);
  const selectedRepoRoot = path.resolve(options.selectedRepoRoot ?? options.repoRoot);

  if (!isInsideDirectory(repoRoot, selectedRepoRoot)) {
    return {
      exitCode: 1,
      message: "Refusing to profile outside repository root"
    };
  }

  const profilePath = path.join(repoRoot, ".shipwright", "repo-profile.json");
  const sourceFiles = await collectSourcePaths(repoRoot);
  const docs = await collectMatchingRootFiles(repoRoot, [
    "README.md",
    "prd-spec-to-pr.md"
  ]);
  const warnings = [];
  const gitMetadata = await readGitMetadata(options);
  const gitAvailable = gitMetadata.exitCode === 0;

  if (!gitAvailable) {
    warnings.push("Git metadata unavailable");
  }

  await mkdir(path.dirname(profilePath), { recursive: true });
  await writeFile(
    profilePath,
    JSON.stringify({
      mode: "greenfield",
      git_available: gitAvailable,
      docs,
      routes: [],
      schemas: [],
      sourceFiles,
      deep_scan: false,
      duration_ms: Date.now() - startedAt
    })
  );

  return { deepScan: false, warnings };
}

function isInsideDirectory(targetPath, rootPath) {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

async function readGitMetadata(options) {
  if (options.readGitMetadata) {
    return options.readGitMetadata();
  }

  return { exitCode: 0 };
}

async function collectMatchingRootFiles(repoRoot, names) {
  let entries;
  try {
    entries = await readdir(repoRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const wanted = new Set(names);
  return entries
    .filter((entry) => entry.isFile() && wanted.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function collectSourcePaths(repoRoot) {
  const srcRoot = path.join(repoRoot, "src");
  const paths = [];

  await collectPaths(srcRoot, "src", paths);
  return paths.sort();
}

async function collectPaths(absoluteDir, relativeDir, paths) {
  let entries;
  try {
    entries = await readdir(absoluteDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      await collectPaths(absolutePath, relativePath, paths);
    } else if (entry.isFile()) {
      paths.push(relativePath);
    }
  }
}
