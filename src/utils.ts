export function sortKeys<T extends { [key: string]: any }>(obj: T) {
  return Object
    .keys(obj)
    .sort()
    .reduce((total: T, current) => {
      total[current] = obj[current]
      return total
    }, Object.create(null))
}
