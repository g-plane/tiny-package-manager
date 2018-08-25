import { promisify } from 'util'
import * as fs from 'fs'
import list from './list'
import install from './install'

(async () => {
  const root = JSON.parse(
    await promisify(fs.readFile)('./package.json', 'utf-8')
  )

  const info = await list(root)
  await Promise.all(
    Array.from(info.topLevel.entries()).map(pair => install(...pair))
  )
  await Promise.all(
    info.unsatisfied.map(
      item => install(item.name, item.version, `/node_modules/${item.parent}`)
    )
  )
})()
