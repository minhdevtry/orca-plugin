import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Orca Canonical Agent Definitions (sourced directly from Orca's TUI_AGENT_CONFIG & WellKnownAgentType)
 */
export const ORCA_CANONICAL_AGENTS = {
  claude: {
    id: 'claude',
    label: 'Claude Code (Orca Native)',
    detectCmd: 'claude',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
  },
  antigravity: {
    id: 'antigravity',
    label: 'Google Antigravity (AGY)',
    detectCmd: 'agy',
    aliases: ['antigravity'],
    defaultModel: 'gemini-2.5-flash-thinking',
    models: ['gemini-2.5-flash-thinking', 'gemini-2.5-pro', 'gemini-2.5-flash']
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini CLI',
    detectCmd: 'gemini',
    defaultModel: 'gemini-2.5-flash-thinking',
    models: ['gemini-2.5-flash-thinking', 'gemini-2.5-flash', 'gemini-2.5-pro']
  },
  codex: {
    id: 'codex',
    label: 'OpenAI Codex CLI',
    detectCmd: 'codex',
    defaultModel: 'o3-mini',
    models: ['o3-mini', 'o1', 'gpt-4o', 'gpt-4.5-preview']
  },
  opencode: {
    id: 'opencode',
    label: 'OpenCode Agent',
    detectCmd: 'opencode',
    defaultModel: 'deepseek-coder-v2',
    models: ['deepseek-coder-v2', 'deepseek-chat', 'llama-3.3-70b']
  },
  pi: {
    id: 'pi',
    label: 'Pi Agent CLI',
    detectCmd: 'pi',
    defaultModel: 'pi-default',
    models: ['pi-default']
  },
  grok: {
    id: 'grok',
    label: 'Grok CLI Agent',
    detectCmd: 'grok',
    defaultModel: 'grok-2',
    models: ['grok-2', 'grok-beta']
  },
  minimax: {
    id: 'minimax',
    label: 'MiniMax Agent',
    detectCmd: 'minimax',
    aliases: ['mimo-code'],
    defaultModel: 'minimax-m3',
    models: ['minimax-m3', 'minimax-abab6.5']
  }
}

/**
 * Checks if a command binary is present on PATH
 */
async function checkCommandInstalled(cmd) {
  try {
    await execFileAsync('which', [cmd], { timeout: 1500 })
    return true
  } catch (e) {
    return false
  }
}

/**
 * Discovers which of Orca's canonical agents are actually installed and detected on this machine.
 * Parallels Orca's useDetectedAgents hook.
 */
export async function discoverInstalledOrcaAgents() {
  const discovered = []

  for (const [key, meta] of Object.entries(ORCA_CANONICAL_AGENTS)) {
    const isInstalled = await checkCommandInstalled(meta.detectCmd)
    let aliasInstalled = false
    if (!isInstalled && meta.aliases) {
      for (const alias of meta.aliases) {
        if (await checkCommandInstalled(alias)) {
          aliasInstalled = true
          break
        }
      }
    }

    discovered.push({
      id: meta.id,
      label: meta.label,
      detectCmd: meta.detectCmd,
      defaultModel: meta.defaultModel,
      models: meta.models,
      installed: isInstalled || aliasInstalled
    })
  }

  return discovered
}

/**
 * Resolves optimal detected agent and model for a given stage
 */
export async function resolveOptimalOrcaAgent(stage, userPreference = null) {
  const detected = await discoverInstalledOrcaAgents()
  const installedMap = new Map(detected.filter(d => d.installed).map(d => [d.id, d]))

  if (userPreference && installedMap.has(userPreference.agent)) {
    const agentMeta = installedMap.get(userPreference.agent)
    return {
      agent: agentMeta.id,
      model: userPreference.model || agentMeta.defaultModel
    }
  }

  // Smart fallback based on what Orca has detected installed
  if (installedMap.has('claude')) {
    return { agent: 'claude', model: ORCA_CANONICAL_AGENTS.claude.defaultModel }
  }
  if (installedMap.has('antigravity')) {
    return { agent: 'antigravity', model: ORCA_CANONICAL_AGENTS.antigravity.defaultModel }
  }
  if (installedMap.has('gemini')) {
    return { agent: 'gemini', model: ORCA_CANONICAL_AGENTS.gemini.defaultModel }
  }
  if (installedMap.has('codex')) {
    return { agent: 'codex', model: ORCA_CANONICAL_AGENTS.codex.defaultModel }
  }

  // Default to first detected or fallback
  const firstInstalled = detected.find(d => d.installed)
  if (firstInstalled) {
    return { agent: firstInstalled.id, model: firstInstalled.defaultModel }
  }

  return { agent: 'claude', model: 'claude-3-7-sonnet-20250219' }
}
