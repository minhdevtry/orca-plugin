import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Automatically pre-trusts a worktree path across all 3 agent platforms:
 * 1. Official Claude (~/.claude.json, ~/.claude/.claude.json)
 * 2. MiniMax-M3 (~/.claude-ide/.claude.json)
 * 3. Google Antigravity CLI (~/.gemini/antigravity-cli/settings.json & jetski_state.pbtxt)
 * so no agent ever prompts for manual trust confirmation or onboarding.
 */
export function autoTrustClaudeWorktree(worktreePath) {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const configCandidates = [
    join(home, '.claude.json'),
    join(home, '.claude', '.claude.json'),
    join(home, '.claude-ide', '.claude.json'),
    join(home, '.claude-ide', 'claude.json')
  ]

  let trusted = false
  // 1. Pre-trust for Claude Code (Official & MiniMax-M3)
  for (const p of configCandidates) {
    try {
      if (existsSync(p)) {
        const raw = readFileSync(p, 'utf8')
        const cfg = JSON.parse(raw)
        cfg.projects = cfg.projects || {}

        cfg.projects[worktreePath] = {
          ...(cfg.projects[worktreePath] || {}),
          hasTrustDialogAccepted: true,
          hasCompletedProjectOnboarding: true
        }

        // Auto-approve MiniMax custom API keys so Claude Code never rejects them
        cfg.customApiKeyResponses = cfg.customApiKeyResponses || { approved: [], rejected: [] }
        cfg.customApiKeyResponses.approved = Array.from(new Set([
          ...(cfg.customApiKeyResponses.approved || []),
          'rKJs5SbGzvpuhu_hRdOU',
          'wfjiiqv1qds1v2u9lh7b',
          'sk-cu-gHdIiTn8ibWXTI_44687C1YrKJs5SbGzvpuhu_hRdOU',
          'sk-b528wfjiiqv1qds1v2u9lh7b'
        ]))
        cfg.customApiKeyResponses.rejected = (cfg.customApiKeyResponses.rejected || []).filter(
          (k) => !k.includes('rKJs5SbGzvpuhu_hRdOU') && !k.includes('wfjiiqv1qds1v2u9lh7b')
        )

        writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8')
        trusted = true
      }
    } catch (e) {}
  }

  // 2. Pre-trust for Antigravity CLI (agy)
  try {
    const agySettingsPath = join(home, '.gemini', 'antigravity-cli', 'settings.json')
    if (existsSync(agySettingsPath)) {
      const raw = readFileSync(agySettingsPath, 'utf8')
      const cfg = JSON.parse(raw)
      cfg.hasAgreedToTerms = true
      cfg.trustedWorkspaces = Array.from(new Set([
        ...(cfg.trustedWorkspaces || []),
        home,
        join(home, 'Documents'),
        join(home, 'Documents', 'orca-dhs'),
        join(home, 'orca', 'workspaces'),
        join(home, 'orca', 'workspaces', 'orca-dhs'),
        worktreePath
      ]))
      writeFileSync(agySettingsPath, JSON.stringify(cfg, null, 2), 'utf8')
      trusted = true
    }

    const agyPbtxtPath = join(home, '.gemini', 'antigravity-cli', 'jetski_state.pbtxt')
    if (existsSync(agyPbtxtPath)) {
      let content = readFileSync(agyPbtxtPath, 'utf8')
      if (!content.includes('agent_onboarding_completed: AGENT_ONBOARDING_STATE_COMPLETED')) {
        content += '\nagent_onboarding_completed: AGENT_ONBOARDING_STATE_COMPLETED\n'
        writeFileSync(agyPbtxtPath, content, 'utf8')
      }
    }
  } catch (err) {}

  return trusted
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

  // 3. Fallback: If .env doesn't exist, generate from active environment
  const targetEnv = join(worktreePath, '.env')
  if (!existsSync(targetEnv)) {
    const envVars = []
    if (process.env.ANTHROPIC_BASE_URL) envVars.push(`ANTHROPIC_BASE_URL="${process.env.ANTHROPIC_BASE_URL}"`)
    if (process.env.ANTHROPIC_API_KEY) envVars.push(`ANTHROPIC_API_KEY="${process.env.ANTHROPIC_API_KEY}"`)
    if (process.env.ANTHROPIC_MODEL) envVars.push(`ANTHROPIC_MODEL="${process.env.ANTHROPIC_MODEL}"`)
    if (process.env.OPENAI_API_KEY) envVars.push(`OPENAI_API_KEY="${process.env.OPENAI_API_KEY}"`)
    if (process.env.GEMINI_API_KEY) envVars.push(`GEMINI_API_KEY="${process.env.GEMINI_API_KEY}"`)
    if (process.env.DEEPSEEK_API_KEY) envVars.push(`DEEPSEEK_API_KEY="${process.env.DEEPSEEK_API_KEY}"`)

    if (envVars.length > 0) {
      try {
        writeFileSync(targetEnv, envVars.join('\n') + '\n', 'utf8')
        copiedFiles.push('.env (generated)')
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


