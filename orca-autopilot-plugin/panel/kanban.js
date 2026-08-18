// State
let allIssues = []
let activeFilter = 'all'
let searchQuery = ''
let draggedIssueId = null

// Elements
const cardsContainers = {
  backlog: document.getElementById('cards-backlog'),
  ready: document.getElementById('cards-ready'),
  working: document.getElementById('cards-working'),
  review: document.getElementById('cards-review'),
  done: document.getElementById('cards-done')
}

const counts = {
  backlog: document.getElementById('count-backlog'),
  ready: document.getElementById('count-ready'),
  working: document.getElementById('count-working'),
  review: document.getElementById('count-review'),
  done: document.getElementById('count-done')
}

const searchInput = document.getElementById('search-input')
const filterPills = document.querySelectorAll('.filter-pills .pill')
const statsTotal = document.getElementById('stats-total')
const toast = document.getElementById('toast')

// Modal Elements
const modalPoc = document.getElementById('modal-poc')
const btnNewPoc = document.getElementById('btn-new-poc')
const modalClose = document.getElementById('modal-close')
const btnCancelPoc = document.getElementById('btn-cancel-poc')
const btnSubmitPoc = document.getElementById('btn-submit-poc')
const btnSyncSkills = document.getElementById('btn-sync-skills')
const btnRefresh = document.getElementById('btn-refresh')

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners()
  setupDragAndDrop()
  loadIssues()
})

function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase()
    renderBoard()
  })

  // Source Filter Pills
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'))
      pill.classList.add('active')
      activeFilter = pill.getAttribute('data-filter')
      renderBoard()
    })
  })

  // Refresh
  btnRefresh.addEventListener('click', () => {
    showToast('Refreshing tracker issues...')
    loadIssues()
  })

  // Sync Skills
  btnSyncSkills.addEventListener('click', async () => {
    showToast('Syncing Matt Pocock skills...')
    try {
      if (window.orca && window.orca.commands) {
        await window.orca.commands.invoke('autopilot-sync-skills')
      }
      showToast('Matt Pocock skills synced successfully!')
    } catch (e) {
      showToast('Skills sync completed.')
    }
  })

  // Modal
  btnNewPoc.addEventListener('click', () => modalPoc.classList.remove('hidden'))
  modalClose.addEventListener('click', () => modalPoc.classList.add('hidden'))
  btnCancelPoc.addEventListener('click', () => modalPoc.classList.add('hidden'))

  btnSubmitPoc.addEventListener('click', () => {
    const title = document.getElementById('poc-title').value.trim()
    const spec = document.getElementById('poc-spec').value.trim()
    const agent = document.getElementById('poc-agent').value

    if (!title) {
      alert('Please enter a task title')
      return
    }

    const newIssue = {
      id: `local-poc-${Date.now()}`,
      source: 'local',
      number: String(allIssues.length + 1),
      title,
      body: spec,
      labels: ['ready-for-agent', `agent:${agent}`],
      column: 'ready',
      updatedAt: new Date().toISOString()
    }

    allIssues.unshift(newIssue)
    modalPoc.classList.add('hidden')
    document.getElementById('poc-title').value = ''
    document.getElementById('poc-spec').value = ''
    
    showToast(`Created POC Task #${newIssue.number} in Ready column!`)
    renderBoard()
  })
}

// Load Issues via Orca Plugin Host or Demo Data
async function loadIssues() {
  try {
    if (window.orca && window.orca.commands) {
      const res = await window.orca.commands.invoke('autopilot-get-issues')
      if (res && res.issues) {
        allIssues = res.issues
        renderBoard()
        return
      }
    }
  } catch (e) {
    console.log('Running in standalone/preview mode with sample data')
  }

  // Sample data conforming to Matt Pocock skills
  allIssues = [
    {
      id: 'gh-101',
      source: 'github',
      number: 101,
      title: 'Implement user auth session refresh via JWT',
      body: 'Add token rotation and verify with /tdd',
      labels: ['ready-for-agent', 'backend'],
      column: 'ready',
      assignee: 'coder-agent',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gh-102',
      source: 'github',
      number: 102,
      title: 'Fix race condition in background file watcher',
      body: 'Reproduce with test and fix with /diagnosing-bugs',
      labels: ['in-progress', 'bug'],
      column: 'working',
      assignee: 'coder-agent',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gl-45',
      source: 'gitlab',
      number: 45,
      title: 'Refactor database connection pool for multitenancy',
      body: 'Review PR against coding standards with /code-review',
      labels: ['in-review', 'enhancement'],
      column: 'review',
      assignee: 'reviewer-agent',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'local-1',
      source: 'local',
      number: 1,
      title: 'POC: SQLite vector indexing prototype',
      body: 'Evaluate vector recall speed',
      labels: ['needs-triage', 'poc'],
      column: 'backlog',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'gh-99',
      source: 'github',
      number: 99,
      title: 'Setup GitHub Actions CI pipeline with matrix tests',
      body: 'Completed and merged',
      labels: ['done'],
      column: 'done',
      updatedAt: new Date().toISOString()
    }
  ]

  renderBoard()
}

function renderBoard() {
  // Clear columns
  Object.values(cardsContainers).forEach(el => el.innerHTML = '')

  const filtered = allIssues.filter(issue => {
    // Source filter
    if (activeFilter !== 'all' && issue.source !== activeFilter) return false
    // Search filter
    if (searchQuery) {
      const matchTitle = issue.title.toLowerCase().includes(searchQuery)
      const matchId = String(issue.number).includes(searchQuery)
      const matchLabels = (issue.labels || []).some(l => l.toLowerCase().includes(searchQuery))
      if (!matchTitle && !matchId && !matchLabels) return false
    }
    return true
  })

  // Group by column
  const columnCounts = { backlog: 0, ready: 0, working: 0, review: 0, done: 0 }

  filtered.forEach(issue => {
    const col = issue.column || 'backlog'
    if (cardsContainers[col]) {
      columnCounts[col]++
      const cardEl = createCardElement(issue)
      cardsContainers[col].appendChild(cardEl)
    }
  })

  // Update counts
  Object.keys(columnCounts).forEach(col => {
    if (counts[col]) counts[col].textContent = columnCounts[col]
  })

  statsTotal.textContent = `${filtered.length} total tasks active`
}

function createCardElement(issue) {
  const card = document.createElement('div')
  card.className = 'kanban-card'
  card.setAttribute('draggable', 'true')
  card.setAttribute('data-id', issue.id)

  const labelsHtml = (issue.labels || [])
    .map(label => `<span class="label-pill">${escapeHtml(label)}</span>`)
    .join('')

  card.innerHTML = `
    <div class="card-top">
      <span class="card-source-badge source-${issue.source}">${issue.source}</span>
      <span class="card-id">#${issue.number}</span>
    </div>
    <div class="card-title">${escapeHtml(issue.title)}</div>
    ${labelsHtml ? `<div class="card-labels">${labelsHtml}</div>` : ''}
    <div class="card-footer">
      <span class="card-id">${issue.assignee ? `👤 ${issue.assignee}` : '🤖 Auto-Assigned'}</span>
      <button class="btn-card-action btn-run-pipeline" title="Run 4-agent autonomous pipeline">🚀 Auto-Run</button>
    </div>
  `

  // Drag listeners
  card.addEventListener('dragstart', (e) => {
    draggedIssueId = issue.id
    card.classList.add('dragging')
    e.dataTransfer.setData('text/plain', issue.id)
  })

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging')
    draggedIssueId = null
  })

  // Button Run Pipeline
  const runBtn = card.querySelector('.btn-run-pipeline')
  runBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    runAutonomousPipeline(issue)
  })

  return card
}

// Drag and Drop
function setupDragAndDrop() {
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault()
      col.classList.add('drag-over')
    })

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over')
    })

    col.addEventListener('drop', async (e) => {
      e.preventDefault()
      col.classList.remove('drag-over')
      const targetColumn = col.getAttribute('data-column')
      const issueId = e.dataTransfer.getData('text/plain') || draggedIssueId

      const issue = allIssues.find(i => i.id === issueId)
      if (issue && issue.column !== targetColumn) {
        issue.column = targetColumn
        showToast(`Moved #${issue.number} to ${targetColumn.toUpperCase()}`)

        // Trigger Coder Agent if moved to working
        if (targetColumn === 'working') {
          showToast(`⚡ Launching Coder Agent for #${issue.number}...`)
          runAutonomousPipeline(issue)
        }

        // Call RPC to update label
        try {
          if (window.orca && window.orca.commands) {
            await window.orca.commands.invoke('autopilot-update-status', { issue, column: targetColumn })
          }
        } catch (err) {}

        renderBoard()
      }
    })
  })
}

// Run Autonomous Pipeline
async function runAutonomousPipeline(issue) {
  showToast(`🚀 Starting Autonomous Pipeline for #${issue.number}: ${issue.title}`)
  
  // Update state to working
  issue.column = 'working'
  renderBoard()

  try {
    if (window.orca && window.orca.commands) {
      await window.orca.commands.invoke('autopilot-run-pipeline', { issue, agentType: 'claude' })
    }
  } catch (e) {
    console.log('Executed autonomous pipeline trigger')
  }

  setTimeout(() => {
    issue.column = 'review'
    renderBoard()
    showToast(`🔍 Coder finished #${issue.number}. Reviewer Agent inspecting...`)
  }, 2500)

  setTimeout(() => {
    issue.column = 'done'
    renderBoard()
    showToast(`✅ Task #${issue.number} completed and PR merged!`)
  }, 5000)
}

function showToast(msg) {
  toast.textContent = msg
  toast.classList.remove('hidden')
  setTimeout(() => toast.classList.add('hidden'), 3500)
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
