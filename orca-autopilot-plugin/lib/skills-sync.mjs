import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const execFileAsync = promisify(execFile)

export const MATT_SKILLS_REPO = 'https://github.com/mattpocock/skills.git'

/**
 * Synchronize Matt Pocock's skills without forking.
 * Clones or updates the upstream repo into a local target directory.
 */
export async function syncMattPocockSkills(targetDir = join(process.env.HOME || '', '.agents/skills/mattpocock')) {
  await mkdir(targetDir, { recursive: true })
  const gitDir = join(targetDir, '.git')

  try {
    if (existsSync(gitDir)) {
      const { stdout } = await execFileAsync('git', ['pull', 'origin', 'main'], { cwd: targetDir })
      return { success: true, action: 'updated', output: stdout.trim(), path: targetDir }
    } else {
      const { stdout } = await execFileAsync('git', ['clone', '--depth', '1', MATT_SKILLS_REPO, targetDir])
      return { success: true, action: 'cloned', output: stdout.trim(), path: targetDir }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      path: targetDir
    }
  }
}

/**
 * List all discovered skills from Matt Pocock's skills repository.
 */
export async function listMattPocockSkills(baseDir = join(process.env.HOME || '', '.agents/skills/mattpocock')) {
  const skillsDir = join(baseDir, 'skills')
  if (!existsSync(skillsDir)) {
    return []
  }

  const results = []
  const categories = ['engineering', 'productivity', 'in-progress', 'misc']

  for (const category of categories) {
    const catPath = join(skillsDir, category)
    if (!existsSync(catPath)) continue

    const entries = await readdir(catPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMd = join(catPath, entry.name, 'SKILL.md')
        if (existsSync(skillMd)) {
          results.push({
            name: entry.name,
            category,
            path: join(catPath, entry.name),
            skillFile: skillMd
          })
        }
      }
    }
  }
  return results
}
