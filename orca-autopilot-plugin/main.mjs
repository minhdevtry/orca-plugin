import { fetchGitHubIssues, fetchGitLabIssues, fetchLocalMarkdownIssues, updateIssueStatus } from './lib/github-gitlab-adapter.mjs'
import { syncMattPocockSkills, listMattPocockSkills } from './lib/skills-sync.mjs'
import { PipelineOrchestrator } from './lib/pipeline-orchestrator.mjs'
import { sendNotification } from './lib/notification-relay.mjs'

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
    return { issues: [...gh, ...gl, ...local] }
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

  // 5. Register RPC handler for Syncing Skills
  orca.commands.register('autopilot-sync-skills', async () => {
    return await syncMattPocockSkills()
  })

  // 6. Listen to Orca Events
  orca.events.on('worktree.created', async (payload) => {
    orca.log(`[AutoPilot] Worktree created: ${payload?.worktreeId || 'new'} at ${payload?.path || ''}`)
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
    }
  })

  orca.log('Orca AutoPilot Plugin Activated successfully.')
}
