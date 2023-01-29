import * as fs from 'fs-extra'
import * as yaml from 'js-yaml'
import * as utils from './utils'
import type { Manifest } from './resolve'

// Define the type of the lock tree.
interface Lock {
  [index: string]: {
    version: string
    url: string
    shasum: string
    dependencies: { [dependency: string]: string }
  }
}

// ------------ The LOCK is here. ---------------------

/*
 * Why we use two separated locks?
 * This is useful when removing packages.
 * When adding or removing packages,
 * the lock file can be updated automatically without any manual operations.
 */

/*
 * This is the old lock.
 * The old lock is only for reading from the lock file,
 * so the old lock should be read only except reading the lock file.
 */
const oldLock: Lock = Object.create(null)

/*
 * This is the new lock.
 * The new lock is only for writing to the lock file,
 * so the new lock should be written only except saving the lock file.
 */
const newLock: Lock = Object.create(null)

// ----------------------------------------------------

/**
 * Save the information of a package to the lock.
 * If that information is not existed in the lock, create it.
 * Otherwise, just update it.
 */
export function updateOrCreate(name: string, info: Lock[string]) {
  // Create it if that information is not existed in the lock.
  if (!newLock[name]) {
    newLock[name] = Object.create(null)
  }

  // Then update it.
  Object.assign(newLock[name]!, info)
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
  /*
   * Retrieve an item by a key from the lock.
   * The format of the key is similar and inspired by Yarn's `yarn.lock` file.
   */
  const item = oldLock[`${name}@${constraint}`]

  // Return `null` instead of `undefined` if we cannot find that.
  if (!item) {
    return null
  }

  // Convert the data structure as the comment above.
  return {
    [item.version]: {
      dependencies: item.dependencies,
      dist: { shasum: item.shasum, tarball: item.url },
    },
  }
}

/**
 * Simply save the lock file.
 */
export async function writeLock() {
  /*
   * Sort the keys of the lock before save it.
   * This is necessary because each time you use the package manager,
   * the order will not be same.
   * Sort it makes useful for git diff.
   */
  await fs.writeFile(
    './tiny-pm.yml',
    yaml.dump(utils.sortKeys(newLock), { noRefs: true })
  )
}

/**
 * Simply read the lock file.
 * Skip it if we cannot find the lock file.
 */
export async function readLock() {
  if (await fs.pathExists('./tiny-pm.yml')) {
    Object.assign(
      oldLock,
      yaml.load(await fs.readFile('./tiny-pm.yml', 'utf-8'))
    )
  }
}
