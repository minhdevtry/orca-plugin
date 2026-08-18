import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Automatically pre-trusts a worktree path in ~/.claude.json so Claude Code
 * never prompts the user for manual trust confirmation.
 */
export function autoTrustClaudeWorktree(worktreePath) {
  try {
    const home = process.env.HOME || process.env.USERPROFILE || ''
    const claudeJsonPath = join(home, '.claude.json')
    if (!existsSync(claudeJsonPath)) return false

    const raw = readFileSync(claudeJsonPath, 'utf8')
    const cfg = JSON.parse(raw)
    cfg.projects = cfg.projects || {}

    cfg.projects[worktreePath] = {
      ...(cfg.projects[worktreePath] || {}),
      hasTrustDialogAccepted: true,
      hasCompletedProjectOnboarding: true
    }

    writeFileSync(claudeJsonPath, JSON.stringify(cfg, null, 2), 'utf8')
    return true
  } catch (e) {
    return false
  }
}

/**
 * Automatically sets up a fresh git worktree with environment files, configs,
 * and pre-trusted status from the main repository checkout (inspired by gilbertlim/orca-plugin worktree-setup).
 */
export async function setupWorktreeEnvironment(mainRepoPath, worktreePath) {
  if (!existsSync(mainRepoPath) || !existsSync(worktreePath)) {
    return { ok: false, message: 'Paths do not exist' }
  }

  // 1. Auto-trust in Claude Code config
  autoTrustClaudeWorktree(worktreePath)

  // 2. Copy untracked config & environment files
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
    worktreePath,
    trusted: true
  }
}

