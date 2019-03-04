import yargs from 'yargs'
import pm from '.'

/*
 * This file is for CLI usage.
 * There isn't too much logic about package manager here.
 * For details please consult the documentation of `yargs` module.
 */

yargs
  .usage('tiny-pm <command> [args]')
  .version()
  .alias('v', 'version')
  .help()
  .alias('h', 'help')
  .command(
    'install',
    'Install the dependencies.',
    argv => {
      argv.option('production', {
        type: 'boolean',
        description: 'Install production dependencies only.',
      })

      argv.boolean('save-dev')
      argv.boolean('dev')
      argv.alias('D', 'dev')

      return argv
    },
    pm
  )
  .command(
    '*',
    'Install the dependencies.',
    argv => argv.option('production', {
      type: 'boolean',
      description: 'Install production dependencies only.',
    }),
    pm
  )
  .parse()
