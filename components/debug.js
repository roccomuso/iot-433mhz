var path   = require('path');
var config = require('../config.json');
var chalk  = require('chalk');

function noop() {}
var firstCall = false;

var PROJECT_NAME = config.debug_namespace; // debug environment

module.exports = function(customName) {
    if (!module.parent) throw Error('module.parent not defined');

    if (process.env.DEBUG === undefined && config.debug === true)
        process.env.DEBUG = PROJECT_NAME + ':*';


    if (process.env.DEBUG && !(process.env.DEBUG).match(new RegExp(config.namespace)) && !firstCall)
        console.log(chalk.bgBlue.bold('DEBUG not enabled on the '+config.namespace+' namespace!'));

    if (!firstCall) {
        console.log(chalk.bgCyan.bold('Debug:', (process.env.DEBUG ? true : false)));
        firstCall = true;
    }

    if (process.env.DEBUG){
        var sector = PROJECT_NAME+':'+ (customName ? customName : path.basename(module.parent.filename));
        return require('debug')(sector);
    }else
        return noop;

};

