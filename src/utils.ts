export function sortKeys<T extends { [key: string]: any }>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  )
}
