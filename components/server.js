const express = require('express') // Get the module
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const config = require('../config.json') // config file
const basicAuth = require('basic-auth')
const cons = require('consolidate')
const cors = require('cors')

const corsOptions = {
  origin: function (origin, cb) {
    cb(null, true)
  },
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true
}

module.exports = function (argv, _cb) {
  // Setting up parameters passed by CLI
  if (argv.username && argv.password) { config.username = argv.username.trim(); config.password = argv.password.trim() }
  config.server_port = argv.port || process.env.PORT || config.server_port

  // Starting Server
  server.listen(config.server_port)
  console.info('Server started on', getLocalIPAddress(), '- Port', config.server_port)

  // enable cors
  app.use(cors(corsOptions))

  // Auth function
  const auth = function (req, res, next) {
    function unauthorized (res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.status(401).send('Unauthorized')
    }

    const user = basicAuth(req)

    if (!user || !user.name || !user.pass) {
      return unauthorized(res)
    }

    if (user.name === config.username && user.pass === config.password) {
      return next()
    } else {
      return unauthorized(res)
    }
  }

  // set authentication middleware
  app.use(auth)

  // set middleware
  app.use(express.json())

  // assign the mustache engine to .html files
  app.engine('html', cons.mustache)

  // set .html as the default extension
  app.set('view engine', 'html')
  app.set('views', __dirname + '/../www/views')

  // API and Web Server + Socket part
  _cb({ http: app, io: io })
}

// utility function
function getLocalIPAddress () {
  // synchronous method
  const interfaces = require('os').networkInterfaces()
  const IPs = []
  for (const devName in interfaces) {
    const iface = interfaces[devName]

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) { IPs.push(alias.address) }
    }
  }

  if (IPs.length === 1) return IPs[0]
  else if (IPs.length > 1) return IPs.toString()
  else return '0.0.0.0'
}
