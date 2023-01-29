import fetch from 'node-fetch'
import * as tar from 'tar'
import * as fs from 'fs-extra'
import * as log from './log'

export default async function (name: string, url: string, location = '') {
  // Prepare for the directory which is for installation
  const path = `${process.cwd()}${location}/node_modules/${name}`

  // Create directories recursively.
  await fs.mkdirp(path)

  const response = await fetch(url)
  /*
   * The response body is a readable stream
   * and the `tar.extract` accepts a readable stream,
   * so we don't need to create a file to disk,
   * and just extract the stuff directly.
   */
  response.body
    ?.pipe(tar.extract({ cwd: path, strip: 1 }))
    .on('close', log.tickInstalling) // Update the progress bar
}
