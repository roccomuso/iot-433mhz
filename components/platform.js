const prompt = require('prompt')
const fs = require('fs')
const chalk = require('chalk')
const config = require('../config.json')
const debug = require('./debug.js')()
const events = require('events')
const eventEmitter = new events.EventEmitter()
const { SerialPort, SerialPortMock } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const IS_DEV = process.env.NODE_ENV === 'development'

const rf433mhz = function (board) {
  let type
  let serial // SerialPort/SerialPortMock instance (arduino only)
  let parser // Readline parser piped from `serial`
  let rpi433 // rpi-433 module (rpi only)
  let rfSniffer, rfSend // rpi-433 only

  function _constructor () {
    if (typeof board === 'undefined') throw new Error('No parameter passed to rf433mhz class')

    type = (board.platform === 'rpi' && !config.platforms.rpi['use-external-arduino']) ? 'rpi' : 'arduino'
    if (type === 'arduino') {
      const openOptions = {
        path: board.port,
        baudRate: config.arduino_baudrate,
        autoOpen: false // manually need to open the port
      }

      if (IS_DEV) {
        // simulate a device on this path so we can develop/test without real hardware
        SerialPortMock.binding.createPort(board.port, { echo: false, record: false })
        serial = new SerialPortMock(openOptions)
      } else {
        serial = new SerialPort(openOptions)
      }

      parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }))
    } else {
      // rpi
      rpi433 = require('rpi-433')
    }
  }
  _constructor()

  this.openSerialPort = function (onOpen) {
    if (type === 'arduino') { // arduino
      serial.open(function (error) {
        if (error) {
          debug('failed to open: ' + error)
          throw error
        } else {
          debug('Serial port opened')
          onOpen()
        }
      })
    } else { // rpi
      // initialize rpi-433 module
      rfSniffer = rpi433.sniffer(config.platforms.rpi['sniff-pin'], config.platforms.rpi['debounce-delay']) // Sniff on the configured PIN with a debounce delay
      rfSend = rpi433.sendCode
    }
  }

  this.on = function (callback) { // Receiving RF Code
    if (type === 'rpi') { // rpi
      rfSniffer.on('codes', function (data) {
        // TODO - need to analyze and parse data
        // callback(...); // gotta return JSON data
      })
    } else { // arduino through serial
      parser.on('data', function (data) {
        try {
          callback(JSON.parse(data)) // returning JSON parsed
        } catch (e) {
          debug('Error parsing this JSON: ', data)
        }
      })
    }
  }

  this.send = function (code, callback) {
    if (type === 'rpi') { // rpi
      // WATCH OUT code CASTING, it has to be a number type. Just check on RPi.
      rfSend(code, config.platforms.rpi['transmitter-pin'], callback)
    } else { // arduino through serial
      if (serial.isOpen) {
        serial.write(String(code), callback)
      } else {
        debug('SerialPort not open!')
      }
    }
  }

  this.isSerialOpen = function () {
    if (type === 'arduino') {
      return serial.isOpen
    }
  }

  this.close = function (callback) {
    if (type === 'arduino') {
      serial.close(callback) // release the Serial Port
    } else {
      // Do nothing, no need to handle that on RPi
    }
  }
}

module.exports = function (argv, module_callback) {
  async function choose_port (whatToUse) {
    const ports = await SerialPort.list()
    if (IS_DEV) ports.push({ path: '/dev/ttyVIRTUAL' })
    if (ports.length === 0) { debug('No ports available'); return }

    console.log('Selectable serial ports:')
    ports.forEach(function (port, i) {
      console.log('(' + (i + 1) + ') ' + port.path)
    })

    if (argv.serialport || process.env.SERIAL_PORT) {
      // return chosen port
      const port = argv.serialport ? argv.serialport.trim() : process.env.SERIAL_PORT.trim()
      const classe = new rf433mhz({ platform: whatToUse, port: port })
      module_callback(classe)
    } else {
      prompt.start()
      prompt.get({
        properties: {
          port: {
            required: true,
            type: 'number',
            conform: function (value) {
              return value > 0 && value <= ports.length
            }
          }
        }
      }, function (err, result) {
        if (err) return console.error(err)
        // choices:
        console.log('Choosen port:', ports[result.port - 1].path)
        // return chosen port
        const classe = new rf433mhz({ platform: whatToUse, port: ports[result.port - 1].path })

        module_callback(classe)
      })
    }
  }

  eventEmitter.on('choose_port', function (whatToUse) {
    choose_port(whatToUse).catch(function (err) { console.error(err) })
  })

  function print_colored_text (text) {
    console.log(chalk.bgCyan(text))
  }

  switch (process.platform) {
    case 'win32':
      // Under windows
      print_colored_text('Running on Windows platform')
      eventEmitter.emit('choose_port', 'arduino')
      break
    case 'darwin':
      // Under MAC OS X
      print_colored_text('Running on MAC OS X platform')
      eventEmitter.emit('choose_port', 'arduino')
      break
    case 'linux':
      // Under Linux
      fs.readFile('/etc/os-release', 'utf-8', function (err, data) {
        if (err) {
          // File doesn't exists
          return console.log(err)
        } else {
          // Running on Linux system
          if (data.indexOf('ID=raspbian') >= 0) {
            print_colored_text('Running on RPi platform')
            console.log('Using external Arduino: ', config.platforms.rpi['use-external-arduino'])
            // Running on RPi
            // Only on RPi will successfully works.
            eventEmitter.emit('choose_port', 'rpi')
          } else {
            // we're on a standard linux
            print_colored_text('Running on Linux platform')
            eventEmitter.emit('choose_port', 'arduino')
          }
        }
      })
      break
    default:
      print_colored_text('Platform ' + process.platform + ' not supported')
      break
  }
}
