#!/usr/bin/env node

/*
 * On Raspberry Pi make sure to execute with SUDO.
 * On Windows platform make sure to have Visual Studio Express 2013 installed (https://github.com/voodootikigod/node-serialport)
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const dotlocal = require('dotlocal')()
const config = require('./config.json')
const argv = require('./components/arguments-handler.js')

if (typeof argv.debug !== 'undefined') config.debug = argv.debug // if defined use CLI debug (NB. current choice is not stored inside the config.json file, so other scripts that are including the file from the disk and are not using this variable istance may not retrieve the right DEBUG choice from the User)
const debug = require('./components/debug.js')()

// Create or open the underlying DB store
const Datastore = require('./EventedDatastore.js') // nedb doesn't provide listener on DB events by default
const db = {}

// Radio Frequency Class platform-independent, assigned once the platform step completes.
// Kept at module scope so the SIGINT handler below can reach it for a graceful shutdown.
let rf433mhz

function printAsciiLogo () {
  return new Promise((resolve) => {
    require('./components/ascii_logo.js')(function (logo) {
      console.log(chalk.magenta(logo)) // print blue ascii logo
      resolve()
    })
  })
}

function initPlatform (argv) {
  return new Promise((resolve) => {
    require('./components/platform.js')(argv, resolve) // platform independent class
  })
}

function openSerialPort (rf433mhz) {
  return new Promise((resolve) => {
    rf433mhz.openSerialPort(function () {
      setTimeout(resolve, 2000) // Arduino AutoReset requires to wait a few seconds before sending data!
    })
  })
}

async function onRFCodeReceived (codeData, dbFunctions, notification, io) {
  const mex = await dbFunctions.putCodeInDB(codeData)
  debug(mex)

  const result = await dbFunctions.isCodeAvailable(codeData.code) // a code is available if not ignored and not assigned.
  debug('code available: ' + result.isAvailable + ' assigned to: ' + result.assignedTo)

  if (result.isAvailable) {
    io.emit('newRFCode', codeData) // sent to every open socket.
  } else {
    // code not available, check if the code is assigned to an alarm card
    const card_shortname = result.assignedTo
    const card = await dbFunctions.alarmTriggered(card_shortname, 'alarm')
    if (card) {
      io.emit('uiTriggerAlarm', card)
      // if Alarm is armed send email or other kind of notification (Telegram mex).
      if (card.device.armed) {
        notification.alarmAdviseAll(card)
      }
    }
  }
  // another WebHook call type (code detected)
  notification.webHookCodeDetected(codeData)
}

async function main () {
  debug('calling initDB')
  // load/create DB
  db.RFCODES = new Datastore({
    filename: path.resolve(__dirname, './DB/rfcodes.db'),
    autoload: true
  })
  db.CARDS = new Datastore({
    filename: path.resolve(__dirname, './DB/cards.db'),
    autoload: true
  })
  db.SETTINGS = new Datastore({
    filename: path.resolve(__dirname, './DB/settings.db'),
    autoload: true
  })

  // Compact DB at regular intervals (see nedb: #Persistence)
  if (config.db_compact_interval > 0) {
    db.RFCODES.setAutocompactionInterval(config.db_compact_interval * 60000 * 60)
    db.CARDS.setAutocompactionInterval(config.db_compact_interval * 60000 * 60)
    db.SETTINGS.setAutocompactionInterval(config.db_compact_interval * 60000 * 60)
  }

  const dbFunctions = require('./components/dbFunctions.js')(db, config)

  debug('printing asciiLogo')
  await printAsciiLogo()

  debug('calling initWebHooks')
  // Initialize WebHooks module.
  const WebHooks = require('node-webhooks')
  const webHooks = new WebHooks({
    db: path.resolve(__dirname, './DB/webHooksDB.json') // json file that store webhook URLs
  })
  const notification = require('./components/notification.js')(dbFunctions, webHooks)

  debug('platform configuration')
  rf433mhz = await initPlatform(argv)

  const name = config.app_title.toLowerCase()
  dotlocal.announce(name).on('question', function () {
    debug('Somebody resolving ' + name + '.local')
  })

  // Put default demo cards in DB if CARDS DB is empty
  try {
    await dbFunctions.initDBCards(require('./components/demo_cards.json'))
    await dbFunctions.initDBSettings()
  } catch (err) {
    console.log('loadDB error:', err)
    console.log(err.stack)
  }

  // Listen on Arduino Serial Port or RF433Mhz chip if on RPi platform.
  await openSerialPort(rf433mhz)

  // Starting HTTP Server, API, and Web Socket
  require('./components/server.js')(argv, function (server) {
    // Handling routes and Web Socket Handler.
    const http = server.http
    const io = server.io

    require('./components/api.js')(http, io, rf433mhz, dbFunctions, webHooks)

    // Web Socket handler
    require('console-mirroring')(io) // Console mirroring

    const socketFunctions = require('./components/socketFunctions.js')(io, rf433mhz, dbFunctions)

    /* LISTENERS */
    io.on('connection', socketFunctions.onConnection)

    db.CARDS.on('inserted', function (card) { // card just inserted
      // refresh every client UI
      socketFunctions.asyncEmitInitCards()
    })

    db.CARDS.on('removed', function (card) { // a card was removed
      // remove from DB codes attached to this card:
      let codes_to_remove
      if (card.type === 'switch') {
        codes_to_remove = {
          $or: [{
            code: card.device.on_code
          }, {
            code: card.device.off_code
          }]
        }
      } else if (card.type === 'alarm') {
        codes_to_remove = {
          code: card.device.trigger_code
        }
      } else codes_to_remove = undefined

      if (codes_to_remove) {
        // delete codes.
        db.RFCODES.remove(codes_to_remove, {
          multi: true
        }, function (err, numRemoved) {
          if (err) console.log(err)
          console.log(numRemoved + ' code/s deleted.')
        })
      }

      // delete img file
      if (card.img) fs.unlink(path.resolve('./www/', card.img), function (err) { if (err) console.error('DeleteFile: file not found', err.path) })

      console.log('Card ' + card.shortname + ' deleted.')
      // refresh every client UI
      socketFunctions.asyncEmitInitCards()
    })

    rf433mhz.on(function (codeData) {
      debug('RFcode received: ', codeData)

      if (codeData.status === 'received') {
        // put in DB if doesn't exists yet
        onRFCodeReceived(codeData, dbFunctions, notification, io).catch(function (err) {
          console.error(err)
        })
      }
    })
  })
}

main().catch(function (err) {
  console.error('Fatal startup error:', err)
  process.exit(1)
})

// (Ctrl + C) - Handler
if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.on('SIGINT', function () {
    process.emit('SIGINT')
  })

  rl.close() // without it we have conflict with the Prompt Module.
}

process.on('SIGINT', function () {
  console.log('Closing...')
  if (typeof rf433mhz !== 'undefined') { // Close Serial Port
    rf433mhz.close(function (err) {
      if (err) console.error('Error: ', err)
      else console.log('Serial Port closed.')
      // graceful shutdown
      process.exit()
    })
  } else process.exit()
})

// Unix Line Ending
