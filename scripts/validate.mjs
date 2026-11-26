import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')

const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}
const count = (text, fragment) => text.split(fragment).length - 1

expect(manifest.name === '@novocube/dsh-base-lite', 'unexpected package name')
expect(manifest.dsh?.bundle?.patch === './cordis.patch.yml', 'missing dsh.bundle.patch')
expect(manifest.engines?.dsh === '>=0.2.2-rc.5 <0.3.0', 'unexpected DSH compatibility range')
expect(count(patch, 'id: preset-base-lite') === 1, 'preset-base-lite must appear exactly once')
expect(count(patch, 'name: 轻量模式（base-lite）') === 1, 'display name must appear exactly once')

for (const plugin of [
  '@deepseek-ai/dsh-tool-bash',
  '@deepseek-ai/dsh-tool-fs',
  '@deepseek-ai/dsh-tool-fs-search',
  '@deepseek-ai/dsh-tool-jobs',
  '@deepseek-ai/dsh-tool-goal',
  '@deepseek-ai/dsh-tool-workflow',
  '@deepseek-ai/dsh-tool-todo',
  '@deepseek-ai/dsh-tool-web',
]) {
  expect(patch.includes(plugin), `missing required plugin: ${plugin}`)
}

for (const forbidden of [
  '@deepseek-ai/dsh-tool-schedule',
  '@deepseek-ai/dsh-tool-skill',
  '@deepseek-ai/dsh-tool-office',
  '@deepseek-ai/dsh-tool-present',
  '@deepseek-ai/dsh-tool-subagent',
  'apiKey',
  'baseURL',
]) {
  expect(!patch.includes(forbidden), `unexpected capability or credential setting: ${forbidden}`)
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`)
  process.exit(1)
}

console.log('PASS: manifest and base-lite preset invariants are valid')
