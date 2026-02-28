#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(scriptDir, '..')
const repoRoot = resolve(appDir, '..', '..')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function updatePackageVersion(path, version) {
  const pkg = readJson(path)
  if (pkg.version !== version) {
    pkg.version = version
    writeJson(path, pkg)
    return true
  }
  return false
}

function updateLockVersion(path, version) {
  const lock = readJson(path)
  let changed = false
  if (lock.version !== version) {
    lock.version = version
    changed = true
  }
  if (lock.packages && lock.packages[''] && lock.packages[''].version !== version) {
    lock.packages[''].version = version
    changed = true
  }
  if (changed) {
    writeJson(path, lock)
  }
  return changed
}

function updateTauriConfVersion(path, version) {
  const conf = readJson(path)
  if (!conf.package) {
    conf.package = {}
  }
  if (conf.package.version !== version) {
    conf.package.version = version
    writeJson(path, conf)
    return true
  }
  return false
}

function updateCargoVersion(path, version) {
  const source = readFileSync(path, 'utf8')
  const lines = source.split('\n')
  let inPackage = false
  let replaced = false

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (/^\[package\]\s*$/.test(line)) {
      inPackage = true
      continue
    }
    if (inPackage && /^\[.+\]\s*$/.test(line)) {
      inPackage = false
    }
    if (inPackage && /^\s*version\s*=\s*".*"\s*$/.test(line)) {
      const updated = `version = "${version}"`
      if (line !== updated) {
        lines[i] = updated
      }
      replaced = true
      break
    }
  }

  if (!replaced) {
    throw new Error(`failed to locate [package] version in ${path}`)
  }

  const next = lines.join('\n')
  if (next !== source) {
    writeFileSync(path, next, 'utf8')
    return true
  }
  return false
}

const tideVersion = execFileSync('tide', ['file', 'Frontend/Alive-app'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim()

if (!tideVersion) {
  throw new Error('empty version from tide')
}

const changed = []

if (updatePackageVersion(resolve(appDir, 'package.json'), tideVersion)) {
  changed.push('package.json')
}
if (updateLockVersion(resolve(appDir, 'package-lock.json'), tideVersion)) {
  changed.push('package-lock.json')
}
const tauriConfPath = resolve(appDir, 'src-tauri', 'tauri.conf.json')
if (existsSync(tauriConfPath) && updateTauriConfVersion(tauriConfPath, tideVersion)) {
  changed.push('src-tauri/tauri.conf.json')
}

const cargoTomlPath = resolve(appDir, 'src-tauri', 'Cargo.toml')
if (existsSync(cargoTomlPath) && updateCargoVersion(cargoTomlPath, tideVersion)) {
  changed.push('src-tauri/Cargo.toml')
}

if (changed.length === 0) {
  console.log(`Version already synced to tide: ${tideVersion}`)
} else {
  console.log(`Synced version to tide ${tideVersion}: ${changed.join(', ')}`)
}
