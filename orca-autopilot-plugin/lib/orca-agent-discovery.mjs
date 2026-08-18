import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Probes Claude CLI dynamically using Orca's control request protocol
 */
export async function probeClaudeModels() {
  return new Promise((resolve) => {
    try {
      const child = spawn('claude', ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose'], {
        timeout: 3000
      })

      let stdout = ''
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.on('error', () => {
        resolve([])
      })

      child.on('close', () => {
        const models = []
        for (const line of stdout.split(/\r?\n/)) {
          if (line.includes('control_response') && line.includes('models')) {
            try {
              const parsed = JSON.parse(line)
              const rawModels = parsed?.response?.response?.models || []
              for (const m of rawModels) {
                if (m?.value && m.value !== 'default') {
                  models.push({ id: m.value, label: m.displayName || m.value, description: m.description })
                }
              }
            } catch (e) {
              // ignore
            }
          }
        }
        resolve(models)
      })

      const stdinPayload = JSON.stringify({
        type: 'control_request',
        request_id: 'orca-model-discovery',
        request: { subtype: 'list_models' }
      }) + '\n'

      child.stdin.write(stdinPayload)
      child.stdin.end()
    } catch (e) {
      resolve([])
    }
  })
}

/**
 * Orca Canonical Agents Definition
 */
export const ORCA_CANONICAL_AGENTS = [
  { id: 'claude', cmd: 'claude', label: 'Claude Code (Orca Native)', envModelKey: 'ANTHROPIC_MODEL' },
  { id: 'antigravity', cmd: 'agy', aliases: ['antigravity'], label: 'Google Antigravity (AGY)', envModelKey: 'GEMINI_MODEL' },
  { id: 'gemini', cmd: 'gemini', label: 'Google Gemini CLI', envModelKey: 'GEMINI_MODEL' },
  { id: 'codex', cmd: 'codex', label: 'OpenAI Codex CLI', envModelKey: 'OPENAI_MODEL' },
  { id: 'opencode', cmd: 'opencode', label: 'OpenCode Agent', envModelKey: 'OPENCODE_MODEL' },
  { id: 'pi', cmd: 'pi', label: 'Pi Agent CLI', envModelKey: 'PI_MODEL' },
  { id: 'grok', cmd: 'grok', label: 'Grok CLI Agent', envModelKey: 'GROK_MODEL' },
  { id: 'minimax', cmd: 'minimax', aliases: ['mimo-code'], label: 'MiniMax Agent', envModelKey: 'MINIMAX_MODEL' }
]

/**
 * Dynamically discovers which agent CLIs are physically installed on PATH
 */
export async function discoverInstalledOrcaAgents() {
  const agents = ORCA_CANONICAL_AGENTS
  const detected = []


  for (const agent of agents) {
    let installed = false
    let version = ''

    try {
      const res = await execFileAsync('which', [agent.cmd], { timeout: 1500 })
      installed = Boolean(res.stdout.trim())
    } catch (e) {
      if (agent.aliases) {
        for (const alias of agent.aliases) {
          try {
            const aliasRes = await execFileAsync('which', [alias], { timeout: 1500 })
            if (aliasRes.stdout.trim()) {
              installed = true
              break
            }
          } catch (err) {
            // continue
          }
        }
      }
    }

    let dynamicModels = []
    if (installed && agent.id === 'claude') {
      dynamicModels = await probeClaudeModels()
    }

    const envModel = process.env[agent.envModelKey] || null

    detected.push({
      id: agent.id,
      label: agent.label,
      cmd: agent.cmd,
      installed,
      envModel,
      discoveredModels: dynamicModels.map(m => m.id)
    })
  }

  return detected
}

/**
 * Resolves optimal detected agent and model dynamically without hardcoding
 */
export async function resolveOptimalOrcaAgent(stage, userPreference = null) {
  const detected = await discoverInstalledOrcaAgents()
  const installed = detected.filter(d => d.installed)

  if (userPreference && userPreference.agent) {
    return {
      agent: userPreference.agent,
      model: userPreference.model || process.env[userPreference.agent.toUpperCase() + '_MODEL'] || 'default'
    }
  }

  if (installed.length > 0) {
    const primary = installed[0]
    return {
      agent: primary.id,
      model: primary.envModel || primary.discoveredModels[0] || 'default'
    }
  }

  return { agent: 'claude', model: 'default' }
}
