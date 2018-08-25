#!/usr/bin/env node
import * as yargs from 'yargs'
import pm from '.'

yargs
  .usage('tiny-pm <command> [args]')
  .version()
  .alias('v', 'version')
  .help()
  .alias('h', 'help')
  .command(
    'install',
    'Install the dependencies.',
    argv => argv.option('production', {
      type: 'boolean',
      description: 'Install production dependencies only.'
    }),
    argv => pm(argv.production)
  )
  .command(
    '*',
    'Install the dependencies.',
    argv => argv.option('production', {
      type: 'boolean',
      description: 'Install production dependencies only.'
    }),
    argv => pm(argv.production)
  )
  .parse()
