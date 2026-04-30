import path from "node:path";
import { mkdir, stat } from "node:fs/promises";

/**
 * Initializes Shipwright workspace directories for a repository.
 *
 * @param {{ repoRoot: string, targetPath?: string, remote?: string, createDirectory?: typeof mkdir }} options - Initialization options.
 * @returns {Promise<{ exitCode: number, message: string, repoRoot?: string, remote?: string, mode?: string, created?: boolean, durationMs?: number }>} Initialization result.
 */
export async function initializeWorkspace(options) {
  const startedAt = Date.now();
  const repoRoot = path.resolve(options.repoRoot);
  const targetPath = path.resolve(options.targetPath ?? path.join(repoRoot, ".shipwright"));
  const relativeTarget = path.relative(repoRoot, targetPath);
  const createDirectory = options.createDirectory ?? mkdir;

  if (relativeTarget === ".." || relativeTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relativeTarget)) {
    return {
      exitCode: 1,
      message: "Refusing to write outside repository root"
    };
  }

  let existed;
  try {
    existed = await pathExists(targetPath);
    await createDirectory(path.join(targetPath, "evidence"), { recursive: true });
    await createDirectory(path.join(repoRoot, "openspec", "specs"), { recursive: true });
  } catch (error) {
    if (error?.code === "EACCES" || error?.code === "EPERM") {
      return {
        exitCode: 1,
        message: "Cannot write Shipwright workspace at .shipwright/"
      };
    }
    throw error;
  }

  return {
    exitCode: 0,
    message: `Initialized ${targetPath}`,
    repoRoot,
    remote: options.remote,
    mode: "local-only",
    created: !existed,
    durationMs: Date.now() - startedAt
  };
}

async function pathExists(candidatePath) {
  try {
    await stat(candidatePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
