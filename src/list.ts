import * as semver from 'semver'
import resolve from './resolve'
import * as log from './log'

type DependenciesMap = { [dependency: string]: string }

// The `topLevel` variable is to flatten packages tree
// to avoid duplication.
const topLevel: Map<string, string> = new Map()

// However, there may be dependencies conflicts,
// so this variable is for that.
const unsatisfied: Array<{ name: string, parent: string, version: string }> = []

async function collectDeps(
  name: string,
  constraint: string,
  deep: string[] = []
) {
  // The `deep` variable is to follow the depth of dependencies path,
  // which is useful for handling dependencies conflicts.
  deep = deep.slice()  // tslint:disable-line no-parameter-reassignment

  // Fetch the manifest information.
  const manifest = await resolve(name)
  // Add currently resolving module to CLI
  log.logResolving(name)

  // Use the latest version of a package
  // while it will conform the semantic version.
  const matched = semver.maxSatisfying(Object.keys(manifest), constraint)
  if (!matched) {
    throw new Error('Cannot resolve suitable package.')
  }

  const existed = topLevel.get(name)
  if (!existed) {
    // If this package is not existed in the `topLevel` map,
    // just put it.
    topLevel.set(name, matched)
  } else if (!semver.satisfies(existed, constraint)) {
    // Yep, the package is already existed in that map,
    // but it has conflicts because of the semantic version.
    // So we should add a record.
    unsatisfied.push({
      name,
      parent: deep[deep.length - 1],
      version: matched
    })
  }

  // Don't forget to collect the dependencies of our dependencies.
  const dependencies = manifest[matched].dependencies
  if (dependencies) {
    deep.push(name)  // depth + 1
    await Promise.all(
      Object.entries(dependencies)
        .map(([dep, range]) => collectDeps(dep, range, deep))
    )
    deep.pop()
  }
}

export default async function (rootManifest: {
  dependencies?: DependenciesMap,
  devDependencies?: DependenciesMap
}) {
  // Process production dependencies
  if (rootManifest.dependencies) {
    await Promise.all(
      Object.entries(rootManifest.dependencies)
        .map(pair => collectDeps(...pair))
    )
  }

  // Process development dependencies
  if (rootManifest.devDependencies) {
    await Promise.all(
      Object.entries(rootManifest.devDependencies)
        .map(pair => collectDeps(...pair))
    )
  }

  return { topLevel, unsatisfied }
}
