import { createHash } from 'node:crypto'
import { createReadStream, watch } from 'node:fs'
import { readdir, lstat, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const MAX_PLUGIN_FILES = 2000
const MAX_PLUGIN_TOTAL_BYTES = 50 * 1024 * 1024

function hashLength(hash, length) {
  const framedLength = Buffer.allocUnsafe(8)
  framedLength.writeBigUInt64BE(BigInt(length))
  hash.update(framedLength)
}

async function collectFiles(root, dir, files, counters) {
  const entries = await readdir(dir, { withFileTypes: true })
  entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))

  for (const entry of entries) {
    if (dir === root && entry.name === '.git') continue
    if (entry.name === 'node_modules' || entry.name === '.git') continue

    const full = join(dir, entry.name)
    const stat = await lstat(full)
    counters.entries += 1

    if (stat.isSymbolicLink()) {
      throw new Error(`symlink not allowed in plugin content: ${relative(root, full)}`)
    }
    if (stat.isDirectory()) {
      await collectFiles(root, full, files, counters)
    } else if (stat.isFile()) {
      counters.bytes += stat.size
      files.push({ path: full, size: stat.size })
    }
  }
}

async function hashPluginTree(root) {
  const files = []
  const counters = { entries: 0, bytes: 0 }
  await collectFiles(root, root, files, counters)

  const hash = createHash('sha256')
  hash.update('orca-plugin-tree-v1\0')

  for (const file of files) {
    const rel = relative(root, file.path).replaceAll('\\', '/')
    hashLength(hash, Buffer.byteLength(rel, 'utf8'))
    hash.update(rel, 'utf8')
    hashLength(hash, file.size)

    for await (const chunk of createReadStream(file.path)) {
      hash.update(chunk)
    }
  }

  return hash.digest('hex')
}

function canonicalizeCapabilitySet(capabilities) {
  const encoded = (capabilities || []).map((capability) =>
    JSON.stringify(
      Object.fromEntries(Object.entries(capability).sort(([a], [b]) => a.localeCompare(b)))
    )
  )
  return JSON.stringify([...new Set(encoded)].sort())
}

function fingerprintPluginConsent(manifest) {
  const capabilities = canonicalizeCapabilitySet(manifest.capabilities || [])
  const workerIdentity = manifest.main === undefined ? '' : '\0trusted-node-worker'
  const raw = `${capabilities}${workerIdentity}`
  return `sha256-${createHash('sha256').update(raw).digest('base64')}`
}

export async function installPlugin(sourceDir, pluginsDir = join(process.env.HOME || '', '.config/orca/plugins')) {
  console.log(`Installing Orca plugin from ${sourceDir}...`)

  const manifestPath = join(sourceDir, 'orca-plugin.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`No orca-plugin.json found at ${manifestPath}`)
  }

  const manifestRaw = JSON.parse(await readFile(manifestPath, 'utf8'))
  const publisher = manifestRaw.publisher || 'minhdn3'
  const id = manifestRaw.id || 'orca-autopilot'
  const pluginKey = `${publisher}.${id}`
  const version = manifestRaw.version || '1.0.0'

  // Calculate deterministic tree hash & exact Orca consent fingerprint
  const contentHash = await hashPluginTree(sourceDir)
  const consentFingerprint = fingerprintPluginConsent(manifestRaw)
  console.log(`Content Hash: ${contentHash}`)
  console.log(`Consent Fingerprint: ${consentFingerprint}`)

  const pluginDir = join(pluginsDir, pluginKey)
  const versionDir = join(pluginDir, contentHash)
  const provenanceDir = join(pluginDir, '.install-provenance')

  // Clean old dir if exists
  await rm(pluginDir, { recursive: true, force: true })
  await mkdir(versionDir, { recursive: true })
  await mkdir(provenanceDir, { recursive: true })

  // Copy files
  await cp(sourceDir, versionDir, {
    recursive: true,
    filter: (src) => !src.includes('.git') && !src.includes('node_modules')
  })

  // Write current pointer file (text file containing hash)
  const currentPointerPath = join(pluginDir, 'current')
  await writeFile(currentPointerPath, contentHash + '\n', 'utf8')

  // Write provenance record in .install-provenance/<hash>.json
  const provenancePath = join(provenanceDir, `${contentHash}.json`)
  const provenanceData = {
    version: 1,
    entry: {
      pluginKey,
      version,
      source: { kind: 'local-path', path: sourceDir },
      resolvedCommit: null,
      contentHash,
      installedAt: Date.now(),
      consentFingerprint
    }
  }
  await writeFile(provenancePath, JSON.stringify(provenanceData, null, 2), 'utf8')

  // Update plugins.lock.json
  const lockfilePath = join(pluginsDir, 'plugins.lock.json')
  let lockfile = { version: 1, plugins: {} }
  if (existsSync(lockfilePath)) {
    try {
      lockfile = JSON.parse(await readFile(lockfilePath, 'utf8'))
    } catch (e) {}
  }

  lockfile.plugins = lockfile.plugins || {}
  lockfile.plugins[pluginKey] = {
    pluginKey,
    version,
    source: { kind: 'local-path', path: sourceDir },
    resolvedCommit: null,
    contentHash,
    consentFingerprint,
    capabilityHash: consentFingerprint,
    installedAt: Date.now()
  }

  await writeFile(lockfilePath, JSON.stringify(lockfile, null, 2), 'utf8')

  // Automatically approve and enable plugin in Orca's profile settings
  const profileDataPath = join(process.env.HOME || '', '.config/orca/profiles/local-default/orca-data.json')
  if (existsSync(profileDataPath)) {
    try {
      const profileData = JSON.parse(await readFile(profileDataPath, 'utf8'))
      profileData.settings = profileData.settings || {}
      profileData.settings.pluginSystemEnabled = true
      profileData.settings.pluginConsents = profileData.settings.pluginConsents || {}
      profileData.settings.pluginConsents[pluginKey] = consentFingerprint
      profileData.settings.disabledPlugins = (profileData.settings.disabledPlugins || []).filter(k => k !== pluginKey)
      await writeFile(profileDataPath, JSON.stringify(profileData, null, 2), 'utf8')
      console.log(`✅ Approved and enabled in Orca profile: ${pluginKey}`)
    } catch (e) {
      console.warn('Could not update profile settings:', e)
    }
  }

  console.log(`✅ Plugin successfully installed as ${pluginKey} in ${versionDir}`)
}

// CLI execution
const args = process.argv.slice(2)
const isWatch = args.includes('--watch') || args.includes('-w')
const targetPath = resolve(args.find(a => !a.startsWith('-')) || process.cwd())

async function main() {
  await installPlugin(targetPath)

  if (isWatch) {
    console.log(`👀 Watching for changes in ${targetPath}...`)
    let debounceTimer = null
    watch(targetPath, { recursive: true }, (eventType, filename) => {
      if (!filename || filename.includes('node_modules') || filename.includes('.git')) return
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        console.log(`🔄 File changed: ${filename}. Reinstalling plugin...`)
        try {
          await installPlugin(targetPath)
        } catch (e) {
          console.error('❌ Reinstall failed:', e.message)
        }
      }, 500)
    })
  }
}

main().catch(err => {
  console.error('❌ Install failed:', err)
  process.exit(1)
})
