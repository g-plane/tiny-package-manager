import * as fs from 'fs-extra'
import * as yaml from 'js-yaml'
import { Manifest } from './resolve'

// Define the type of the lock tree.
interface Lock {
  [index: string]: {
    version: string
    url: string
    shasum: string
    dependencies: { [dependency: string]: string }
  }
}

// Yep, this is the lock.
const lock: Lock = Object.create(null)

/**
 * Save the information of a package to the lock.
 * If that information is not existed in the lock, create it.
 * Otherwise, just update it.
 */
export function updateOrCreate(name: string, info: object) {
  // Create it if that information is not existed in the lock.
  if (!lock[name]) {
    lock[name] = Object.create(null)
  }

  // Then update it.
  Object.assign(lock[name], info)
}

/**
 * Retrieve the information of a package by name and it's semantic
 * version range.
 *
 * Note that we don't return the data directly.
 * That is, we just do format the data,
 * which make the data structure similar to npm registry.
 *
 * This can let us avoid changing the logic of the `collectDeps`
 * function in the `list` module.
 */
export function getItem(name: string, constraint: string): Manifest | null {
  // Retrieve an item by a key from the lock.
  // The format of the key is similar and inspired by Yarn's `yarn.lock` file.
  const item = lock[`${name}@${constraint}`]

  // Return `null` instead of `undefined` if we cannot find that.
  if (!item) {
    return null
  }

  // Convert the data structure as the comment above.
  return {
    [item.version]: {
      dependencies: item.dependencies,
      dist: { shasum: item.shasum, tarball: item.url }
    }
  }
}

/**
 * Simply save the lock file.
 */
export async function writeLock() {
  await fs.writeFile(
    './tiny-pm.yml',
    yaml.safeDump(lock, { noRefs: true, sortKeys: true })
  )
}

/**
 * Simply read the lock file.
 * Skip it if we cannot find the lock file.
 */
export async function readLock() {
  if (await fs.pathExists('./tiny-pm.yml')) {
    Object.assign(
      lock,
      yaml.safeLoad(await fs.readFile('./tiny-pm.yml', 'utf-8'))
    )
  }
}
