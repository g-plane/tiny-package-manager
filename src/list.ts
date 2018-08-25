import * as semver from 'semver'
import resolve from './resolve'

type DependenciesMap = { [dependency: string]: string }

const topLevel: Map<string, string> = new Map()
const unsatisfied: Array<{ name: string, parent: string, version: string }> = []

async function collectDeps(
  name: string,
  constraint: string,
  deep: string[] = []
) {
  deep = deep.slice()  // tslint:disable-line no-parameter-reassignment
  const manifest = await resolve(name)

  const matched = semver.maxSatisfying(Object.keys(manifest), constraint)
  if (!matched) {
    throw new Error('Cannot resolve suitable package.')
  }

  const existed = topLevel.get(name)
  if (!existed) {
    topLevel.set(name, matched)
  } else if (!semver.satisfies(existed, constraint)) {
    unsatisfied.push({
      name,
      parent: deep[deep.length - 1],
      version: matched
    })
  }

  const dependencies = manifest[matched].dependencies
  if (dependencies) {
    deep.push(name)
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
  if (rootManifest.dependencies) {
    await Promise.all(
      Object.entries(rootManifest.dependencies)
        .map(pair => collectDeps(...pair))
    )
  }

  if (rootManifest.devDependencies) {
    await Promise.all(
      Object.entries(rootManifest.devDependencies)
        .map(pair => collectDeps(...pair))
    )
  }

  return { topLevel, unsatisfied }
}
