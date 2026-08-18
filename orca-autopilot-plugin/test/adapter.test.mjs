import test from 'node:test'
import assert from 'node:assert/strict'
import { determineKanbanColumn, STATUS_LABELS } from '../lib/github-gitlab-adapter.mjs'
import { PipelineOrchestrator, PIPELINE_STAGES } from '../lib/pipeline-orchestrator.mjs'

test('determineKanbanColumn maps Matt Pocock labels correctly', () => {
  // 1. Working
  assert.equal(determineKanbanColumn(['in-progress']), 'working')
  assert.equal(determineKanbanColumn(['status:in-progress', 'backend']), 'working')

  // 2. Ready for Agent
  assert.equal(determineKanbanColumn(['ready-for-agent']), 'ready')

  // 3. Review
  assert.equal(determineKanbanColumn(['in-review']), 'review')
  assert.equal(determineKanbanColumn(['ready-for-human']), 'review')

  // 4. Done
  assert.equal(determineKanbanColumn(['done']), 'done')
  assert.equal(determineKanbanColumn(['closed']), 'done')

  // 5. Backlog
  assert.equal(determineKanbanColumn(['needs-triage']), 'backlog')
  assert.equal(determineKanbanColumn(['needs-info']), 'backlog')
  assert.equal(determineKanbanColumn(['unknown-label']), 'backlog')
})

test('PipelineOrchestrator initializes with correct stages', () => {
  const orchestrator = new PipelineOrchestrator()
  assert.equal(PIPELINE_STAGES.SPEC, 'specifying')
  assert.equal(PIPELINE_STAGES.CODE, 'coding')
  assert.equal(PIPELINE_STAGES.REVIEW, 'reviewing')
  assert.equal(PIPELINE_STAGES.RELEASE, 'releasing')
  assert.equal(PIPELINE_STAGES.DONE, 'completed')
})
