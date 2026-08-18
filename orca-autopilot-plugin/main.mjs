import { fetchGitHubIssues, fetchGitLabIssues, fetchLocalMarkdownIssues, updateIssueStatus } from './lib/github-gitlab-adapter.mjs'
import { syncMattPocockSkills, listMattPocockSkills } from './lib/skills-sync.mjs'
import { PipelineOrchestrator } from './lib/pipeline-orchestrator.mjs'
import { sendNotification } from './lib/notification-relay.mjs'
import { discoverInstalledOrcaAgents } from './lib/orca-agent-discovery.mjs'
import { setupWorktreeEnvironment } from './lib/worktree-setup.mjs'



export default function activate(orca) {
  orca.log('Orca AutoPilot Plugin Activating...')

  const orchestrator = new PipelineOrchestrator({ orcaHost: orca.host })

  // 1. Register Quick Command: Sync Issues & Skills
  orca.commands.register('autopilot-sync', async () => {
    orca.log('Syncing issues and Matt Pocock skills...')
    const skillResult = await syncMattPocockSkills()
    const ghIssues = await fetchGitHubIssues()
    const glIssues = await fetchGitLabIssues()
    const localIssues = await fetchLocalMarkdownIssues()

    await orca.host.call('notifications.show', {
      title: 'AutoPilot Synced',
      body: `Loaded ${ghIssues.length + glIssues.length + localIssues.length} issues across repositories.`
    })

    return {
      skills: skillResult,
      issueCount: ghIssues.length + glIssues.length + localIssues.length
    }
  })

  // 2. Register RPC handler for Fetching all Issues
  orca.commands.register('autopilot-get-issues', async () => {
    const [gh, gl, local] = await Promise.all([
      fetchGitHubIssues(),
      fetchGitLabIssues(),
      fetchLocalMarkdownIssues()
    ])
    const allIssues = [...gh, ...gl, ...local]
    // Apply crash recovery if recovering from prior unclean session
    const recovered = orchestrator.recoverIncompleteTasks(allIssues)
    return { issues: recovered }
  })

  // 3. Register RPC handler for Updating Status Label
  orca.commands.register('autopilot-update-status', async (args) => {
    const { issue, column } = args || {}
    if (!issue || !column) return { error: 'Invalid parameters' }
    return await updateIssueStatus(issue, column)
  })

  // 4. Register RPC handler for Triggering Multi-Agent Pipeline
  orca.commands.register('autopilot-run-pipeline', async (args) => {
    const { issue, agentType } = args || {}
    if (!issue) return { error: 'No issue provided' }
    return await orchestrator.runTaskPipeline(issue, { agentType: agentType || 'claude' })
  })

  // 5. Register RPC handler for Worktree Cleanup
  orca.commands.register('autopilot-cleanup-worktree', async (args) => {
    const { task } = args || {}
    if (!task) return { error: 'No task provided' }
    return await orchestrator.cleanupCompletedWorktree(task)
  })

  // 6. Register RPC handler for Syncing Skills
  orca.commands.register('autopilot-sync-skills', async () => {
    return await syncMattPocockSkills()
  })

  // 7. Register RPC handler for Discovering Orca Installed Agents
  orca.commands.register('autopilot-get-detected-agents', async () => {
    return await discoverInstalledOrcaAgents()
  })


  // 7. Listen to Orca Events
  orca.events.on('worktree.created', async (payload) => {
    orca.log(`[AutoPilot] Worktree created: ${payload?.worktreeId || 'new'} at ${payload?.path || ''}`)
    if (payload?.path) {
      const res = await setupWorktreeEnvironment(process.cwd(), payload.path)
      if (res.copiedFiles && res.copiedFiles.length > 0) {
        orca.log(`[AutoPilot] Synced environment files to worktree: ${res.copiedFiles.join(', ')}`)
      }
    }
  })


  orca.events.on('worktree.removed', async (payload) => {
    orca.log(`[AutoPilot] Worktree removed: ${payload?.worktreeId || ''}`)
  })

  orca.events.on('agent.status.changed', async (payload) => {
    orca.log(`[AutoPilot] Agent state changed: ${payload?.state} in ${payload?.worktreeId || 'workspace'}`)
    if (payload?.state === 'done') {
      await sendNotification({
        title: 'Agent Completed Task',
        body: `Agent in ${payload.worktreeId || 'worktree'} has finished execution.`,
        level: 'success',
        orcaHost: orca.host
      })
    } else if (payload?.state === 'waiting' || payload?.state === 'blocked') {
      await sendNotification({
        title: 'Agent Needs Input',
        body: `Agent in ${payload.worktreeId || 'worktree'} requires human attention.`,
        level: 'info',
        orcaHost: orca.host
      })
    }
  })

  orca.log('Orca AutoPilot Plugin Activated successfully.')
}
