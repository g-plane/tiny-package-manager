import * as fs from 'fs-extra'
import list from './list'
import install from './install'
import * as log from './log'

export default async function (production = false) {
  // Read the `package.json` of current working directory.
  const root = await fs.readJson('./package.json')

  // In production mode,
  // we just need to resolve production dependencies.
  if (production) {
    delete root.devDependencies
  }

  // Generate the dependencies information.
  const info = await list(root)

  // Prepare for the progress bar.
  // Note that we re-compute the number of packages.
  // Because of the duplication,
  // number of resolved packages is not equivalent to
  // the number of packages to be installed.
  log.prepareInstall(info.topLevel.size + info.unsatisfied.length)

  // Install top level packages.
  await Promise.all(
    Array.from(info.topLevel.entries()).map(pair => install(...pair))
  )

  // Install packages which have conflicts.
  await Promise.all(
    info.unsatisfied.map(
      item => install(item.name, item.version, `/node_modules/${item.parent}`)
    )
  )
}
