import fetch from 'node-fetch'

type Manifest = {
  [version: string]: {
    dependencies?: { [dep: string]: string }
    dist: { shasum: string, tarball: string }
  }
}

const REGISTRY = process.env.REGISTRY || 'https://registry.npmjs.org/'

const cache: { [dep: string]: Manifest } = {}

export default async function (name: string): Promise<Manifest> {
  if (cache[name]) {
    return cache[name]
  }

  const response = await fetch(`${REGISTRY}${name}`)

  const json = await response.json()
  if (json.error) {
    throw new ReferenceError(`No such package: ${name}`)
  }

  return cache[name] = json.versions
}
