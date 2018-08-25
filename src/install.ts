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
  const path = `${process.cwd()}${location}/node_modules/${name}`
  const url = (await resolve(name))[version].dist.tarball

  await makeDir(path)

  const response = await fetch(url)
  response.body.pipe(tar.extract({ cwd: path, strip: 1 }))
}
