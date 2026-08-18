import test from 'node:test'
import assert from 'node:assert/strict'
import { determineKanbanColumn, STATUS_LABELS } from '../lib/github-gitlab-adapter.mjs'
import { PipelineOrchestrator, PIPELINE_STAGES, AGENT_MATRIX, MAX_SELF_HEALING_ATTEMPTS } from '../lib/pipeline-orchestrator.mjs'

test('determineKanbanColumn maps Matt Pocock labels directly to 6 canonical lanes', () => {
  // 1. in-progress
  assert.equal(determineKanbanColumn(['in-progress']), 'in-progress')
  assert.equal(determineKanbanColumn(['status:in-progress', 'backend']), 'in-progress')

  // 2. ready-for-agent
  assert.equal(determineKanbanColumn(['ready-for-agent']), 'ready-for-agent')

  // 3. ready-for-human
  assert.equal(determineKanbanColumn(['in-review']), 'ready-for-human')
  assert.equal(determineKanbanColumn(['ready-for-human']), 'ready-for-human')

  // 4. needs-info
  assert.equal(determineKanbanColumn(['needs-info']), 'needs-info')

  // 5. done
  assert.equal(determineKanbanColumn(['done']), 'done')
  assert.equal(determineKanbanColumn(['closed']), 'done')

  // 6. needs-triage (default / unknown)
  assert.equal(determineKanbanColumn(['needs-triage']), 'needs-triage')
  assert.equal(determineKanbanColumn(['unknown-label']), 'needs-triage')
})

test('PipelineOrchestrator initializes with 6 stages and complete agent matrix', () => {
  const orchestrator = new PipelineOrchestrator()
  assert.equal(PIPELINE_STAGES.NEEDS_TRIAGE, 'needs-triage')
  assert.equal(PIPELINE_STAGES.NEEDS_INFO, 'needs-info')
  assert.equal(PIPELINE_STAGES.READY_FOR_AGENT, 'ready-for-agent')
  assert.equal(PIPELINE_STAGES.IN_PROGRESS, 'in-progress')
  assert.equal(PIPELINE_STAGES.READY_FOR_HUMAN, 'ready-for-human')
  assert.equal(PIPELINE_STAGES.DONE, 'done')

  // Verify Agent Matrix configuration
  assert.equal(AGENT_MATRIX['needs-triage'].agent, 'claude')
  assert.equal(AGENT_MATRIX['needs-triage'].subagents.length, 3)

  assert.equal(AGENT_MATRIX['needs-info'].agent, 'antigravity')
  assert.equal(AGENT_MATRIX['needs-info'].subagents.length, 2)

  assert.equal(AGENT_MATRIX['in-progress'].agent, 'claude')
  assert.equal(AGENT_MATRIX['in-progress'].subagents.research, 'gemini-2.5-flash')
  assert.equal(AGENT_MATRIX['in-progress'].subagents.bulk, 'minimax-m3')

  assert.equal(MAX_SELF_HEALING_ATTEMPTS, 3)
})

test('PipelineOrchestrator recovers incomplete tasks upon crash recovery', () => {
  const orchestrator = new PipelineOrchestrator()
  const dirtyTasks = [
    { id: '1', title: 'Feature A', column: 'in-progress' },
    { id: '2', title: 'Feature B', column: 'ready-for-agent' },
    { id: '3', title: 'Feature C', column: 'done' }
  ]

  const recovered = orchestrator.recoverIncompleteTasks(dirtyTasks)
  assert.equal(recovered[0].column, 'ready-for-agent')
  assert.equal(recovered[1].column, 'ready-for-agent')
  assert.equal(recovered[2].column, 'done')
})

test('PipelineOrchestrator executes task pipeline and transitions to ready-for-human', async () => {
  const orchestrator = new PipelineOrchestrator()
  const mockIssue = {
    id: 'gh-101',
    number: 101,
    title: 'Implement Multi-agent Dispatching Matrix',
    body: 'Add support for Claude, Gemini, and MiniMax routing.',
    labels: ['ready-for-agent'],
    column: 'ready-for-agent',
    source: 'local'
  }

  const result = await orchestrator.runTaskPipeline(mockIssue, { repoPath: process.cwd() })
  assert.equal(result.success, true)
  assert.equal(result.runState.stage, PIPELINE_STAGES.READY_FOR_HUMAN)
  assert.equal(result.runState.attempt, 1)
  assert.ok(result.runState.worktree.includes('agent/task-101'))
})
