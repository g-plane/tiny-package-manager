import { promisify } from 'util'
import fetch from 'node-fetch'
import * as tar from 'tar'
import * as mkdirp from 'mkdirp'
import resolve from './resolve'

const makeDir = promisify(mkdirp)

export default async function (
  name: string,
  version: string,
  location = ''
) {
  // Prepare for the directory which is for installation
  const path = `${process.cwd()}${location}/node_modules/${name}`
  // Compute the tarball URL
  const url = (await resolve(name))[version].dist.tarball

  // Make directories recursively.
  await makeDir(path)

  const response = await fetch(url)
  // The response body is a readable stream
  // and the `tar.extract` accepts a readable stream,
  // so we don't need to create a file to disk,
  // and just extract the stuff directly.
  response.body.pipe(tar.extract({ cwd: path, strip: 1 }))
}
