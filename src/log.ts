import logUpdate from 'log-update'
import ProgressBar from 'progress'

let progress: ProgressBar

/**
 * Update currently resolved module.
 * This is similar to Yarn.
 */
export function logResolving(name: string) {
  logUpdate(`[1/2] Resolving: ${name}`)
}

/**
 * Use a friendly progress bar.
 */
export function prepareInstall(count: number) {
  logUpdate('[1/2] Finished resolving.')
  progress = new ProgressBar('[2/2] Installing [:bar]', {
    complete: '#',
    total: count,
  })
}

/**
 * This is for update the progress bar
 * once tarball extraction is finished.
 */
export function tickInstalling() {
  progress.tick()
}
