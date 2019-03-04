import * as fs from 'fs-extra'
import findUp from 'find-up'
import yargs from 'yargs'
import * as utils from './utils'
import list, { PackageJson } from './list'
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

export default async function (args: yargs.Arguments) {
  // Find and read the `package.json`.
  const jsonPath = (await findUp('package.json'))!
  const root = await fs.readJson(jsonPath)

  /*
   * If we are adding new packages by running `tiny-pm install <packageName>`,
   * collect them through CLI arguments.
   * This purpose is to behaves like `npm i <packageName>` or `yarn add`.
   */
  const additionalPackages = args._.slice(1)
  if (additionalPackages.length) {
    if (args['save-dev'] || args.dev) {
      root.devDependencies = root.devDependencies || {}
      /*
       * At this time we don't specific version now, so set it empty.
       * And we will fill it later after fetched the information.
       */
      additionalPackages.forEach(pkg => (root.devDependencies[pkg] = ''))
    } else {
      root.dependencies = root.dependencies || {}
      /*
       * At this time we don't specific version now, so set it empty.
       * And we will fill it later after fetched the information.
       */
      additionalPackages.forEach(pkg => (root.dependencies[pkg] = ''))
    }
  }

  /*
   * In production mode,
   * we just need to resolve production dependencies.
   */
  if (args.production) {
    delete root.devDependencies
  }

  // Read the lock file
  await lock.readLock()

  // Generate the dependencies information.
  const info = await list(root)

  // Save the lock file asynchronously.
  lock.writeLock()

  /*
   * Prepare for the progress bar.
   * Note that we re-compute the number of packages.
   * Because of the duplication,
   * number of resolved packages is not equivalent to
   * the number of packages to be installed.
   */
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

  beautifyPackageJson(root)

  // Save the `package.json` file.
  fs.writeJson(jsonPath, root, { spaces: 2 })

  // That's all! Everything should be finished if no errors occurred.
}

/**
 * Beautify the `dependencies` field and `devDependencies` field.
 */
function beautifyPackageJson(packageJson: PackageJson) {
  if (packageJson.dependencies) {
    packageJson.dependencies = utils.sortKeys(packageJson.dependencies)
  }

  if (packageJson.devDependencies) {
    packageJson.devDependencies = utils.sortKeys(packageJson.devDependencies)
  }
}
