import * as fs from 'fs-extra'
import * as findUp from 'find-up'
import list from './list'
import install from './install'
import * as log from './log'
import * as lock from './lock'

/**
 * Welcome to learn about how to build a package manager.
 * In this guide I will tell you how to build a
 * very very simple package manager like npm or Yarn.
 *
 * I will use ES2017 syntax in this guide,
 * so please make sure you know about it.
 *
 * Also this guide is written in TypeScript.
 * Don't worry if you don't know TypeScript,
 * just treat it as JavaScript with some type annotations.
 * If you have leart Flow, that's great,
 * because they are similar.
 *
 * To make this guide as simple as possible,
 * I haven't handled some edge cases.
 *
 * Good luck and let's start!   :)
 *
 * This is just the main file of the whole tiny package manager,
 * but not all the logic,
 * because I split them into different modules and files for better management.
 */

export default async function (production = false) {
  // Find and read the `package.json`.
  const root = await fs.readJson((await findUp('package.json'))!)

  // In production mode,
  // we just need to resolve production dependencies.
  if (production) {
    delete root.devDependencies
  }

  // Read the lock file
  await lock.readLock()

  // Generate the dependencies information.
  const info = await list(root)

  // Save the lock file asynchronously.
  lock.writeLock()

  // Prepare for the progress bar.
  // Note that we re-compute the number of packages.
  // Because of the duplication,
  // number of resolved packages is not equivalent to
  // the number of packages to be installed.
  log.prepareInstall(
    Object.keys(info.topLevel).length + info.unsatisfied.length
  )

  // Install top level packages.
  await Promise.all(
    Object
      .entries(info.topLevel)
      .map(([name, { url }]) => install(name, url))
  )

  // Install packages which have conflicts.
  await Promise.all(
    info.unsatisfied.map(
      item => install(item.name, item.url, `/node_modules/${item.parent}`)
    )
  )

  // That's all! Everything should be finished if no errors occurred.
}
