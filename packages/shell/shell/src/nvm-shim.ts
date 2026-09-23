/**
 * nvm-windows shim PATH support.
 *
 * On Windows, command tools launched through the npm/pnpm toolchain carry the
 * currently-active raw Node install directory (for example
 * `<NVM_HOME>\installs\v22.22.0`) on their PATH, ahead of nvm-windows' `.nodejs`
 * shim junction. That ordering defeats nvm's `.nvmrc` auto-detection: a raw
 * install directory never switches Node, while nvm only switches when `node`
 * resolves through its `.nodejs` (-> `.shim`) launcher. Prepending the shim
 * junction to the child PATH restores `.nvmrc`-driven version selection.
 *
 * The helpers are pure and platform-gated; environments without nvm-windows
 * (non-Windows, or no `NVM_HOME` with a `.nodejs` sibling) leave the PATH
 * untouched.
 * @module @deepseek-ai/dsh-shell/nvm-shim
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** nvm-windows reports its home through this environment variable. */
const NVM_HOME = 'NVM_HOME'

/** Name of nvm-windows' shim junction directory inside the nvm home. */
const SHIM_DIR = '.nodejs'

/**
 * Resolve the nvm-windows `.nodejs` shim junction directory on Windows.
 * Returns the path only when `process.platform === 'win32'`, `NVM_HOME` is set,
 * and that `<NVM_HOME>\.nodejs` junction (or directory) exists. This gates the
 * PATH rewrite to machines that actually shim Node through nvm-windows.
 * @param env - environment to inspect; defaults to `process.env`.
 * @returns the junction directory, or `undefined` when nvm-windows shimming is unavailable.
 */
export function win32NvmShimDirectory(env: Readonly<NodeJS.ProcessEnv> = process.env): string | undefined {
  if (process.platform !== 'win32') return undefined
  const home = env[NVM_HOME]
  if (home === undefined || home === '') return undefined
  const candidate = join(home, SHIM_DIR)
  return existsSync(candidate) ? candidate : undefined
}

/**
 * Prepend the nvm-windows shim junction directory to a PATH value so `node`
 * resolves through nvm's `.nodejs` launcher and `.nvmrc` auto-detection fires.
 * Any existing occurrence of the shim directory in the PATH is removed first, so
 * the junction always wins over a raw install directory placed ahead of it by
 * the npm/pnpm toolchain.
 * @param pathValue - the inherited PATH value (or `undefined` when unset).
 * @param env - environment to inspect; defaults to `process.env`.
 * @returns the PATH value with the shim junction first, or the original when
 *   the shim is unavailable or the PATH is unset/empty.
 */
export function pathWithNvmShimPrepend(pathValue: string | undefined, env: Readonly<NodeJS.ProcessEnv> = process.env): string | undefined {
  const shim = win32NvmShimDirectory(env)
  if (shim === undefined || pathValue === undefined || pathValue === '') return pathValue
  const segments = pathValue.split(';').filter(segment => segment !== shim)
  return [shim, ...segments].join(';')
}