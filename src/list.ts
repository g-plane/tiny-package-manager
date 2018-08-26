import * as semver from 'semver'
import resolve from './resolve'
import * as log from './log'
import * as lock from './lock'

type DependenciesMap = { [dependency: string]: string }

// The `topLevel` variable is to flatten packages tree
// to avoid duplication.
const topLevel: {
  [name: string]: { url: string, version: string }
} = Object.create(null)

// However, there may be dependencies conflicts,
// so this variable is for that.
const unsatisfied: Array<{ name: string, parent: string, url: string }> = []

async function collectDeps(
  name: string,
  constraint: string,
  deep: Array<{ name: string, dependencies: { [dep: string]: string } }> = []
) {
  // Retrieve a single manifest by name from the lock.
  const fromLock = lock.getItem(name, constraint)

  // Fetch the manifest information.
  // If that manifest is not existed in the lock,
  // fetch it from network.
  const manifest = fromLock || await resolve(name)

  // Add currently resolving module to CLI
  log.logResolving(name)

  // Use the latest version of a package
  // while it will conform the semantic version.
  const matched = semver.maxSatisfying(Object.keys(manifest), constraint)
  if (!matched) {
    throw new Error('Cannot resolve suitable package.')
  }

  if (!topLevel[name]) {
    // If this package is not existed in the `topLevel` map,
    // just put it.
    topLevel[name] = { url: manifest[matched].dist.tarball, version: matched }
  } else if (!semver.satisfies(topLevel[name].version, constraint)) {
    // Yep, the package is already existed in that map,
    // but it has conflicts because of the semantic version.
    // So we should add a record.
    unsatisfied.push({
      name,
      parent: deep[deep.length - 1].name,
      url: manifest[matched].dist.tarball
    })
  } else {
    const conflictIndex = checkDeepDependencies(name, matched, deep)
    if (conflictIndex !== -1) {
      // Because of the module resolution algorithm of Node.js,
      // there may be some conflicts in the dependencies of dependency.
      // How to check it? See the `checkDeepDependencies` function below.
      // ----------------------------
      // We just need information of the previous **two** dependencies
      // of the dependency which has conflicts.
      // :(  Not sure if it's right.
      unsatisfied.push({
        name,
        parent: deep
          .map(({ name }) => name)
          .slice(conflictIndex - 2)
          .join('/node_modules/'),
        url: manifest[matched].dist.tarball
      })
    } else {
      // Remember to return this function to skip the dependencis checking.
      // This will avoid dependencies circulation.
      return
    }
  }

  // Don't forget to collect the dependencies of our dependencies.
  const dependencies = manifest[matched].dependencies
  if (dependencies) {
    // Collect the dependencies of dependency,
    // so it's time to be deeper.
    deep.push({ name, dependencies })
    await Promise.all(
      Object.entries(dependencies)
        .map(([dep, range]) => collectDeps(dep, range, deep.slice()))
    )
    deep.pop()

    // If the manifest is not existed in the lock, just save it.
    if (!fromLock) {
      lock.updateOrCreate(`${name}@${constraint}`, {
        version: matched,
        shasum: manifest[matched].dist.shasum,
        url: manifest[matched].dist.tarball,
        dependencies
      })
    }
  }
}

/**
 * This function is to check if there are conflicts in the
 * dependencies of dependency, not the top level dependencies.
 */
function checkDeepDependencies(
  name: string,
  version: string,
  deep: Array<{ name: string, dependencies: { [dep: string]: string } }>
) {
  return deep.findIndex(({ dependencies }) => {
    // If this package is not as a dependency of another package,
    // this is safe and we just return `true`.
    if (!dependencies[name]) {
      return true
    }

    // Semantic version checking.
    return semver.satisfies(version, dependencies[name])
  })
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
