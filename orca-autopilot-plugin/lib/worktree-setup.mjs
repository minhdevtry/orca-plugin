import { existsSync, copyFileSync, symlinkSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Automatically sets up a fresh git worktree with environment files and configs
 * from the main repository checkout (inspired by gilbertlim/orca-plugin worktree-setup).
 */
export async function setupWorktreeEnvironment(mainRepoPath, worktreePath) {
  if (!existsSync(mainRepoPath) || !existsSync(worktreePath)) {
    return { ok: false, message: 'Paths do not exist' }
  }

  const copiedFiles = []
  const candidates = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.test',
    'tsconfig.json',
    '.npmrc'
  ]

  for (const file of candidates) {
    const src = join(mainRepoPath, file)
    const dest = join(worktreePath, file)
    if (existsSync(src) && !existsSync(dest)) {
      try {
        copyFileSync(src, dest)
        copiedFiles.push(file)
      } catch (e) {}
    }
  }

  return {
    ok: true,
    copiedFiles,
    worktreePath
  }
}
