/**
 * nvm-windows shim PATH rewrite contract: `win32NvmShimDirectory` resolves the
 * `.nodejs` junction only on Windows with a present home, and
 * `pathWithNvmShimPrepend` lifts that junction to the front of a PATH value so
 * nvm's `.nvmrc` auto-detection beats a raw install directory that npm/pnpm
 * place ahead of it.
 */

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { pathWithNvmShimPrepend, win32NvmShimDirectory } from '../src/nvm-shim.ts'

const NVM_HOME = 'NVM_HOME'
const SHIM_NAME = '.nodejs'

const root = mkdtempSync(join(tmpdir(), 'dsh-nvm-shim-'))
const shimDir = join(root, SHIM_NAME)
const shimEnv = { [NVM_HOME]: root } as Record<string, string>

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

// Each case controls the presence of `root\.nodejs` itself so a shared temp
// root cannot leak junction availability between tests. `win32NvmShimDirectory`
// additionally gates on `process.platform`; the runner here is Windows.

describe('win32NvmShimDirectory', () => {
  it('returns the junction when NVM_HOME points at a directory with a .nodejs sibling', () => {
    mkdirSync(shimDir, { recursive: true })
    try {
      expect(win32NvmShimDirectory(shimEnv)).toBe(shimDir)
    } finally {
      rmSync(shimDir, { recursive: true, force: true })
    }
  })

  it('returns undefined without NVM_HOME', () => {
    expect(win32NvmShimDirectory({})).toBeUndefined()
    expect(win32NvmShimDirectory({ [NVM_HOME]: '' })).toBeUndefined()
  })

  it('returns undefined when the .nodejs sibling does not exist', () => {
    rmSync(shimDir, { recursive: true, force: true })
    expect(win32NvmShimDirectory(shimEnv)).toBeUndefined()
  })
})

describe('pathWithNvmShimPrepend', () => {
  it('lifts the shim junction to the front and removes later duplicates', () => {
    mkdirSync(shimDir, { recursive: true })
    try {
      const inherited = `C:\\bin;${shimDir};C:\\Windows;${shimDir}`
      expect(pathWithNvmShimPrepend(inherited, shimEnv)).toBe(`${shimDir};C:\\bin;C:\\Windows`)
    } finally {
      rmSync(shimDir, { recursive: true, force: true })
    }
  })

  it('returns the PATH unchanged when the shim is unavailable', () => {
    rmSync(shimDir, { recursive: true, force: true })
    expect(pathWithNvmShimPrepend('C:\\bin;C:\\Windows', {})).toBe('C:\\bin;C:\\Windows')
    expect(pathWithNvmShimPrepend('C:\\bin;C:\\Windows', shimEnv)).toBe('C:\\bin;C:\\Windows')
  })

  it('returns the PATH unchanged when it is unset or empty', () => {
    expect(pathWithNvmShimPrepend(undefined, shimEnv)).toBeUndefined()
    expect(pathWithNvmShimPrepend('', shimEnv)).toBe('')
  })
})