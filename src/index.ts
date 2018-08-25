import { promisify } from 'util'
import * as fs from 'fs'
import list from './list'
import install from './install'

(async () => {
  // Read the `package.json` of current working directory.
  const root = JSON.parse(
    await promisify(fs.readFile)('./package.json', 'utf-8')
  )

  // Generate the dependencies information.
  const info = await list(root)
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
})()
