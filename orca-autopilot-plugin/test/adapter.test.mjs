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

test('PipelineOrchestrator initializes with 6 stages, Tripartite Review Committee and matrix', () => {
  const orchestrator = new PipelineOrchestrator()
  assert.equal(PIPELINE_STAGES.NEEDS_TRIAGE, 'needs-triage')
  assert.equal(PIPELINE_STAGES.NEEDS_INFO, 'needs-info')
  assert.equal(PIPELINE_STAGES.READY_FOR_AGENT, 'ready-for-agent')
  assert.equal(PIPELINE_STAGES.IN_PROGRESS, 'in-progress')
  assert.equal(PIPELINE_STAGES.READY_FOR_HUMAN, 'ready-for-human')
  assert.equal(PIPELINE_STAGES.DONE, 'done')

  // Verify Tripartite Review Committee
  const committee = AGENT_MATRIX.review.committee
  assert.equal(committee.length, 3)
  assert.equal(committee[0].model, 'minimax-m3')
  assert.equal(committee[1].model, 'gemini-2.5-flash-thinking')
  assert.equal(committee[2].model, 'gemini-2.5-flash-thinking')

  assert.equal(AGENT_MATRIX.review.defaultNeedReviewTime, 1)
  assert.equal(MAX_SELF_HEALING_ATTEMPTS, 3)
})

test('PipelineOrchestrator handles Fast-path minor review fixes in-place', async () => {
  const orchestrator = new PipelineOrchestrator()
  const mockIssue = {
    id: 'local-201',
    number: 201,
    title: 'Fix typo in README',
    body: 'Typo on line 10',
    labels: ['ready-for-agent'],
    column: 'ready-for-agent',
    source: 'local',
    _mockReviewResult: {
      passed: false,
      severity: 'minor',
      feedback: 'Typo in comment on line 12: change ocra to orca'
    }
  }

  const result = await orchestrator.runTaskPipeline(mockIssue, { repoPath: process.cwd() })
  assert.equal(result.success, true)
  assert.equal(result.runState.stage, PIPELINE_STAGES.READY_FOR_HUMAN)
  assert.equal(result.runState.reviewRound, 1)
})

test('PipelineOrchestrator handles Slow-path major review fixes by re-queuing when under needReviewTime', async () => {
  const orchestrator = new PipelineOrchestrator()
  const mockIssue = {
    id: 'local-202',
    number: 202,
    title: 'Refactor Core Coordinator',
    body: 'Rewrite state machine',
    labels: ['ready-for-agent'],
    column: 'ready-for-agent',
    source: 'local',
    needReviewTime: 2,
    _mockReviewResult: {
      passed: false,
      severity: 'major',
      feedback: 'Architecture violation: module boundary breached in coordinator.ts'
    }
  }

  const result = await orchestrator.runTaskPipeline(mockIssue, { repoPath: process.cwd() })
  assert.equal(result.success, true)
  assert.equal(result.reQueued, true)
  assert.equal(result.stage, PIPELINE_STAGES.READY_FOR_AGENT)
  assert.equal(result.runState.reviewRound, 1)
})

test('PipelineOrchestrator executes task pipeline and transitions to ready-for-human when review passes', async () => {
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
