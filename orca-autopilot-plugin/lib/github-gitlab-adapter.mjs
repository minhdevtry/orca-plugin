import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { existsSync } from 'node:fs'

const execFileAsync = promisify(execFile)

/**
 * Standard Status Labels based on mattpocock/skills vocabulary
 */
export const STATUS_LABELS = {
  BACKLOG: ['needs-triage', 'needs-info'],
  READY: ['ready-for-agent'],
  WORKING: ['in-progress', 'status:in-progress'],
  REVIEW: ['in-review', 'ready-for-human', 'status:in-review'],
  DONE: ['done', 'closed', 'status:done']
}

export const ALL_STATUS_LABELS = [
  'needs-triage',
  'needs-info',
  'ready-for-agent',
  'ready-for-human',
  'in-progress',
  'status:in-progress',
  'in-review',
  'status:in-review',
  'done',
  'status:done',
  'wontfix'
]

/**
 * Map issue labels to Kanban Column bucket
 */
export function determineKanbanColumn(labels = []) {
  const normalizedLabels = labels.map(l => (typeof l === 'string' ? l : l.name || '').toLowerCase())

  if (normalizedLabels.some(l => STATUS_LABELS.WORKING.includes(l))) {
    return 'working'
  }
  if (normalizedLabels.some(l => STATUS_LABELS.REVIEW.includes(l))) {
    return 'review'
  }
  if (normalizedLabels.some(l => STATUS_LABELS.READY.includes(l))) {
    return 'ready'
  }
  if (normalizedLabels.some(l => STATUS_LABELS.DONE.includes(l))) {
    return 'done'
  }
  return 'backlog'
}

/**
 * Fetch GitHub issues using `gh` CLI
 */
export async function fetchGitHubIssues(cwd = process.cwd()) {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['issue', 'list', '--limit', '50', '--json', 'number,title,body,labels,assignees,updatedAt,url,state'],
      { cwd }
    )
    const rawIssues = JSON.parse(stdout || '[]')
    return rawIssues.map(issue => {
      const labels = (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name))
      return {
        id: `gh-${issue.number}`,
        source: 'github',
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        labels,
        column: issue.state === 'CLOSED' ? 'done' : determineKanbanColumn(labels),
        assignee: issue.assignees?.[0]?.login || null,
        url: issue.url,
        updatedAt: issue.updatedAt
      }
    })
  } catch (error) {
    // Return empty if not a GitHub repo or CLI not available
    return []
  }
}

/**
 * Fetch GitLab issues using `glab` CLI
 */
export async function fetchGitLabIssues(cwd = process.cwd()) {
  try {
    const { stdout } = await execFileAsync(
      'glab',
      ['issue', 'list', '--per-page', '50', '--output', 'json'],
      { cwd }
    )
    const rawIssues = JSON.parse(stdout || '[]')
    return rawIssues.map(issue => {
      const labels = issue.labels || []
      return {
        id: `gl-${issue.iid || issue.id}`,
        source: 'gitlab',
        number: issue.iid || issue.id,
        title: issue.title,
        body: issue.description || '',
        labels,
        column: issue.state === 'closed' ? 'done' : determineKanbanColumn(labels),
        assignee: issue.assignee?.username || null,
        url: issue.web_url,
        updatedAt: issue.updated_at
      }
    })
  } catch (error) {
    return []
  }
}

/**
 * Fetch Local Markdown issues from `.scratch/<feature>/issues/*.md`
 */
export async function fetchLocalMarkdownIssues(cwd = process.cwd()) {
  const scratchDir = join(cwd, '.scratch')
  if (!existsSync(scratchDir)) return []

  const issues = []
  try {
    const features = await readdir(scratchDir, { withFileTypes: true })
    for (const feat of features) {
      if (!feat.isDirectory()) continue
      const issuesPath = join(scratchDir, feat.name, 'issues')
      if (!existsSync(issuesPath)) continue

      const files = await readdir(issuesPath)
      for (const file of files) {
        if (!file.endsWith('.md')) continue
        const fullPath = join(issuesPath, file)
        const content = await readFile(fullPath, 'utf8')
        
        // Parse Title & Status from local markdown template
        const titleMatch = content.match(/^#\s+(.+)$/m)
        const statusMatch = content.match(/\*\*Status:\*\*\s*([^\n\r]+)/i)
        const blockedMatch = content.match(/\*\*Blocked by:\*\*\s*([^\n\r]+)/i)

        const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '')
        const status = statusMatch ? statusMatch[1].trim().toLowerCase() : 'ready-for-agent'
        const blockedBy = blockedMatch ? blockedMatch[1].trim() : null

        issues.push({
          id: `local-${feat.name}-${file}`,
          source: 'local',
          number: file.replace(/\D/g, '') || '0',
          title,
          body: content,
          labels: [status],
          blockedBy,
          column: determineKanbanColumn([status]),
          filePath: fullPath,
          feature: feat.name,
          updatedAt: new Date().toISOString()
        })
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return issues
}

/**
 * Update status label on GitHub/GitLab or Local file
 */
export async function updateIssueStatus(issue, targetColumn, cwd = process.cwd()) {
  const newLabel = targetColumn === 'working' ? 'in-progress' :
                   targetColumn === 'ready' ? 'ready-for-agent' :
                   targetColumn === 'review' ? 'in-review' :
                   targetColumn === 'done' ? 'done' : 'needs-triage'

  if (issue.source === 'github') {
    // Remove existing status labels and add the new one
    const labelsToRemove = (issue.labels || []).filter(l => ALL_STATUS_LABELS.includes(l))
    const args = ['issue', 'edit', String(issue.number), '--add-label', newLabel]
    for (const rem of labelsToRemove) {
      if (rem !== newLabel) {
        args.push('--remove-label', rem)
      }
    }
    await execFileAsync('gh', args, { cwd })
    return { success: true, newLabel }
  } else if (issue.source === 'gitlab') {
    await execFileAsync('glab', ['issue', 'update', String(issue.number), '--label', newLabel], { cwd })
    return { success: true, newLabel }
  } else if (issue.source === 'local' && issue.filePath) {
    let content = await readFile(issue.filePath, 'utf8')
    content = content.replace(/\*\*Status:\*\*\s*[^\n\r]+/i, `**Status:** ${newLabel}`)
    await writeFile(issue.filePath, content, 'utf8')
    return { success: true, newLabel }
  }

  return { success: false, error: 'Unsupported issue source' }
}

/**
 * Create a new Pull Request / Merge Request
 */
export async function createPullRequest({ title, body, branch, base = 'main', cwd = process.cwd(), source = 'github' }) {
  if (source === 'github') {
    const { stdout } = await execFileAsync('gh', ['pr', 'create', '--title', title, '--body', body, '--base', base, '--head', branch], { cwd })
    return { success: true, prUrl: stdout.trim() }
  } else {
    const { stdout } = await execFileAsync('glab', ['mr', 'create', '--title', title, '--description', body, '--target-branch', base, '--source-branch', branch, '--yes'], { cwd })
    return { success: true, prUrl: stdout.trim() }
  }
}
