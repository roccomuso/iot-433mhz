const path = require('path')
const config = require('../config.json')
const chalk = require('chalk')

function noop () {}
let firstCall = false

const PROJECT_NAME = config.debug_namespace // debug environment

module.exports = function (customName) {
  if (!module.parent) throw new Error('module.parent not defined')

  if (process.env.DEBUG === undefined && config.debug === true) { process.env.DEBUG = PROJECT_NAME + ':*' }

  if (process.env.DEBUG && !(process.env.DEBUG).match(new RegExp(config.namespace)) && !firstCall) { console.log(chalk.bgBlue.bold('DEBUG not enabled on the ' + config.namespace + ' namespace!')) }

  if (!firstCall) {
    console.log(chalk.bgCyan.bold('Debug:', (!!process.env.DEBUG)))
    firstCall = true
  }

  if (process.env.DEBUG) {
    const sector = PROJECT_NAME + ':' + (customName || path.basename(module.parent.filename))
    return require('debug')(sector)
  } else { return noop }
}
