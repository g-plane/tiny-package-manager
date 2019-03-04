import fetch from 'node-fetch'

// Just type definition and this can be ignored.
export interface Manifest {
  [version: string]: {
    dependencies?: { [dep: string]: string }
    dist: { shasum: string, tarball: string }
  }
}

// This allows us use a custom npm registry.
const REGISTRY = process.env.REGISTRY || 'https://registry.npmjs.org/'

/*
 * Use cache to prevent duplicated network request,
 * when asking the same package.
 */
const cache: { [dep: string]: Manifest } = Object.create(null)

export default async function (name: string): Promise<Manifest> {
  /*
   * If the requested package manifest is existed in cache,
   * just return it directly.
   */
  if (cache[name]) {
    return cache[name]
  }

  const response = await fetch(`${REGISTRY}${name}`)

  const json = await response.json()
  if (json.error) {
    throw new ReferenceError(`No such package: ${name}`)
  }

  // Add the manifest info to cache and return it.
  return (cache[name] = json.versions)
}
