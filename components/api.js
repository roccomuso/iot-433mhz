const express = require('express')
const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')
const version = require('../package.json').version
const debug = require('./debug.js')()
const validator = require('validator')
const multer = require('multer')

const ALLOWED_IMG_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']

const upload = multer({
  dest: path.resolve(__dirname, '../www/uploads/'),
  fileFilter: function (req, file, cb) { // file filter operations
    debug(file)
    if (file) { // img file not mandatory
      if (validator.isIn(path.extname(file.originalname).toLowerCase(), ALLOWED_IMG_EXT)) cb(null, true)
      else cb(null, false)
    }
  }
})

// loading backgrounds imgs
const BACKGROUNDS = fs.readdirSync(path.join(__dirname, '../www/assets/img/backgrounds'))
debug('Available UI backgrounds:', BACKGROUNDS)

module.exports = function (app, io, rf433mhz, dbFunctions, webHooks) {
  // get settings
  app.route('/api/settings/get').get(asyncHandler(async (req, res) => {
    const settings = await dbFunctions.getDBSettings()
    res.status(200).json({ status: 'ok', settings: settings })
  }))

  // get IoT System UID
  app.route('/api/system/get/uid').get(asyncHandler(async (req, res) => {
    const UID = await dbFunctions.getIotUID()
    if (UID) res.status(200).json({ status: 'ok', uid: UID })
    else res.status(400).json({ status: 'error', error: "can't generate the IoT System UID" })
  }))

  // generate a new IoT System UID
  app.route('/api/system/new/uid').get(asyncHandler(async (req, res) => {
    const UID = await dbFunctions.generateNewUID()
    res.status(200).json({ status: 'ok', uid: UID })
  }))

  // start Telegram API
  app.route('/api/system/telegram/enable').get(asyncHandler(async (req, res) => {
    const outcome = await dbFunctions.toggleTelegram(true)
    res.status(200).json({ status: 'ok', enabled: outcome })
  }))

  // stop Telegram API
  app.route('/api/system/telegram/disable').get(asyncHandler(async (req, res) => {
    const outcome = await dbFunctions.toggleTelegram(false)
    res.status(200).json({ status: 'ok', enabled: outcome })
  }))

  // start Email Notification API
  app.route('/api/system/email/enable').get(asyncHandler(async (req, res) => {
    const outcome = await dbFunctions.toggleEmail(true)
    res.status(200).json({ status: 'ok', enabled: outcome })
  }))

  // stop Email Notification API
  app.route('/api/system/email/disable').get(asyncHandler(async (req, res) => {
    const outcome = await dbFunctions.toggleEmail(false)
    res.status(200).json({ status: 'ok', enabled: outcome })
  }))

  // send the specified code
  app.route('/api/code/send/:code').get(async (req, res) => {
    if (typeof req.params.code === 'undefined') return res.status(400).json({ status: 'error', error: 'Provide the code to sent' })

    try {
      await sendCode(rf433mhz, req.params.code)
    } catch (err) {
      debug('Error:', err)
    }
    res.status(200).json({ status: 'ok' })
  })

  // return list of ignored codes.
  app.route('/api/codes/ignored').get(asyncHandler(async (req, res) => {
    const ignored = await dbFunctions.getIgnoredCodes()
    res.status(200).json(ignored)
  }))

  // return all the codes in DB
  app.route('/api/codes/all').get(asyncHandler(async (req, res) => {
    const codes = await dbFunctions.getAllCodes()
    res.status(200).json(codes)
  }))

  // list available codes
  app.route('/api/codes/available').get(asyncHandler(async (req, res) => {
    const codes = await dbFunctions.getAvailableCodes()
    res.status(200).json(codes)
  }))

  // return all the codes in DB
  app.route('/api/cards/all').get(asyncHandler(async (req, res) => {
    const codes = await dbFunctions.getAllCards()
    res.status(200).json(codes)
  }))

  // return a signle card with the specified shortname
  app.route('/api/cards/get/:shortname').get(asyncHandler(async (req, res) => {
    if (typeof req.params.shortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a shortname.' })
    const card = await dbFunctions.getCard({ shortname: req.params.shortname })
    res.status(200).json(card)
  }))

  // delete a card given his _id or shortname
  app.route('/api/cards/delete/:shortname').get(asyncHandler(async (req, res) => {
    if (typeof req.params.shortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide the shortname if you wanna delete a card' })
    const numDeleted = await dbFunctions.deleteCard({ shortname: req.params.shortname })
    res.status(200).json({ status: 'ok', cards_deleted: numDeleted })
  }))

  // new card insertion
  app.post('/api/cards/new', upload.single('card_img'), async (req, res) => {
    // req.body will hold the text fields, if there were any
    if (!checkRequiredParams(req.body)) return res.status(400).json({ done: false, err: 'Make sure to pass all the required params.' })

    try {
      await dbFunctions.checkDatabaseCorrispondence(req.body)

      // req.file will hold the img file, if there was one
      let imgWebPath
      if (req.file) {
        const file_name = req.body.shortname.trim().toLowerCase().replace(/ /g, '-') + path.extname(req.file.originalname)
        const origin_path = path.resolve(__dirname, '..', req.file.path)
        const destination_path = path.resolve(__dirname, '../www/uploads/', file_name)
        await fsPromises.rename(origin_path, destination_path) // rename file uploaded
        imgWebPath = './uploads/' + file_name
      }

      // put data in DB (imgWebPath is undefined if there was no img)
      const newCard = await dbFunctions.putCardInDatabase(req, imgWebPath)
      res.status(200).json({ done: true, newCard: newCard })
    } catch (err) {
      res.status(400).json({ done: false, err: err.toString() })
    }
  })

  // arm all cards
  app.route('/api/cards/arm-all').post(asyncHandler(async (req, res) => {
    const result = await dbFunctions.armDisarmAll(true)
    io.emit('refresh', '')
    res.status(200).json({ status: 'ok', cards_affected: result.affected, armed: true })
  }))

  // disarm all cards
  app.route('/api/cards/disarm-all').post(asyncHandler(async (req, res) => {
    const result = await dbFunctions.armDisarmAll(false)
    io.emit('refresh', '')
    res.status(200).json({ status: 'ok', cards_affected: result.affected, armed: false })
  }))

  // arm card
  app.route('/api/alarm/:shortname/arm').get(asyncHandler(async (req, res) => {
    if (typeof req.params.shortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide the shortname if you wanna arm a card' })
    const result = await dbFunctions.armCard({ shortname: req.params.shortname, arm: true })
    io.emit('uiArmStatus', { card_id: result.card_id, is_armed: true })
    res.status(200).json({ status: 'ok', cards_affected: result.affected, armed: true })
  }))

  // disarm card
  app.route('/api/alarm/:shortname/disarm').get(asyncHandler(async (req, res) => {
    if (typeof req.params.shortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide the shortname if you wanna disarm a card' })
    const result = await dbFunctions.armCard({ shortname: req.params.shortname, arm: false })
    io.emit('uiArmStatus', { card_id: result.card_id, is_armed: false })
    res.status(200).json({ status: 'ok', cards_affected: result.affected, armed: false })
  }))

  // switch: /api/switch/[shortname]/on
  app.route('/api/switch/:shortname/on').get(asyncHandler((req, res) => commuteSwitch(req, res, dbFunctions, rf433mhz, io, true)))

  // switch: /api/switch/[shortname]/off
  app.route('/api/switch/:shortname/off').get(asyncHandler((req, res) => commuteSwitch(req, res, dbFunctions, rf433mhz, io, false)))

  // switch: /api/switch/[shortname]/toggle
  app.route('/api/switch/:shortname/toggle').get(asyncHandler(async (req, res) => {
    if (typeof req.params.shortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid shortname' })
    const status = await dbFunctions.getSwitchStatus({ shortname: req.params.shortname })
    return commuteSwitch(req, res, dbFunctions, rf433mhz, io, !status)
  }))

  // webHooks: GET /api/webhook/get (get all the stored webHooks)
  app.route('/api/webhook/get').get(asyncHandler(async (req, res) => {
    const data = await webHooks.getDB()
    if (data) res.status(200).json({ status: 'OK', data: data })
    else res.status(400).json({ status: 'error', error: 'error retrieving the data' })
  }))

  // webHooks: GET /api/webhook/get/:webHookShortname (get the selected webHook data)
  app.route('/api/webhook/get/:webHookShortname').get(asyncHandler(async (req, res) => {
    if (typeof req.params.webHookShortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid webHook shortname' })
    const data = await webHooks.getWebHook(req.params.webHookShortname)
    if (data) res.status(200).json({ status: 'OK', data: data })
    else res.status(400).json({ status: 'error', error: 'error retrieving the data' })
  }))

  // webHooks: POST /api/webhook/add/:webHookShortname (add a new webHook url for a specified webhook event name)
  app.route('/api/webhook/add/:webHookShortname').post(asyncHandler(async (req, res) => {
    if (typeof req.params.webHookShortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid webHook shortname' })
    if (!Object.hasOwn(req.body, 'url')) return res.status(400).json({ status: 'error', error: 'JSON url parameter is required' })

    const outcome = await webHooks.add(req.params.webHookShortname, req.body.url)
    if (outcome) res.status(200).json({ status: 'OK', message: 'webHook added!', added: true })
    else res.status(400).json({ status: 'error', message: 'webHook not added.', added: false })
  }))

  // webHooks: GET /api/webhook/delete/:webHookShortname (remove all the urls attached to the webHook selected)
  app.route('/api/webhook/delete/:webHookShortname').get(asyncHandler(async (req, res) => {
    if (typeof req.params.webHookShortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid webHook shortname' })
    const outcome = await webHooks.remove(req.params.webHookShortname)
    if (outcome) res.status(200).json({ status: 'OK', message: 'webHook removed!', deleted: true })
    else res.status(400).json({ status: 'OK', message: 'webHook not found', deleted: false })
  }))

  // webHooks: POST /api/webhook/delete/:webHookShortname (remove a single webhook url for the selected webHook.)
  app.route('/api/webhook/delete/:webHookShortname').post(asyncHandler(async (req, res) => {
    if (typeof req.params.webHookShortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid webHook shortname' })
    if (!req.body) return res.status(400).json({ status: 'error', error: 'Body not valid.' })

    const outcome = await webHooks.remove(req.params.webHookShortname, req.body.url)
    if (outcome) res.status(200).json({ status: 'OK', message: 'webHook removed!', deleted: true })
    else res.status(400).json({ status: 'OK', message: 'webHook not found', deleted: false })
  }))

  // webHooks: POST /api/webhook/trigger/:webHookShortname (trigger a webHook. It requires a JSON body that will be turned over to the webHook URLs.)
  app.route('/api/webhook/trigger/:webHookShortname').post((req, res) => {
    if (typeof req.params.webHookShortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid webHook shortname' })
    webHooks.trigger(req.params.webHookShortname, req.body)
    res.status(200).json({ status: 'OK', message: 'webHooks called!', called: true })
  })

  // handle 404 error for API
  app.all('/api/*', (req, res) => {
    res.status(404).json({ status: 'error', error_code: 404, err: 'API entrypoint not found' })
  })

  // serving index view
  app.get(['/', '/index.html'], (req, res) => {
    res.render('index', {
      cache: true,
      title: 'IoT 433Mhz',
      backgrounds: JSON.stringify(BACKGROUNDS),
      version: version,
      googleAnalyticsID: 'UA-5606214-9'
    })
  })

  // serve as static all the other routes
  const web_dir = path.resolve(__dirname, '../www')
  app.get('*', express.static(web_dir))

  // Middleware that handle 404 error for web pages
  app.use((req, res) => {
    res.status(404).sendFile(web_dir + '/404.html')
  })
}

// Wraps an async Express handler so rejected promises produce a standard error response
// instead of an unhandled rejection.
function asyncHandler (handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((err) => {
      res.status(400).json({ status: 'error', error: err.toString() })
    })
  }
}

function sendCode (rf433mhz, code) {
  return new Promise((resolve, reject) => {
    rf433mhz.send(code, (err, out) => (err ? reject(err) : resolve(out)))
  })
}

async function commuteSwitch (req, res, dbFunctions, rf433mhz, io, on) {
  if (typeof req.params.shortname === 'undefined') return res.status(400).json({ status: 'error', error: 'Please provide a valid shortname' })

  const docs = await dbFunctions.getCard({ shortname: req.params.shortname, type: 'switch' })
  if (docs.length === 0) return res.status(400).json({ status: 'error', error: 'no device found for given shortname' })

  const card = docs[0]
  const code_to_send = on ? card.device.on_code : card.device.off_code

  // send the code.
  await sendCode(rf433mhz, code_to_send)
  // save the new status, without blocking the response on it (the RF code was already sent)
  dbFunctions.setSwitchStatus(card._id, on).catch((err) => console.error('setSwitchStatus error:', err))
  // eventually update UI
  io.emit('uiSwitchToggle', { card_id: card._id, set: on, sound: card.device.notification_sound })
  res.status(200).json({ status: 'ok', switch_toggled: req.params.shortname, code_sent: code_to_send })
}

function checkRequiredParams (params) { // required params (headline, shortname, room, type, on_code/off_code)
  debug('API:/api/cards/new - Received parameters: ', params)

  if (typeof params === 'undefined') return false

  const required_params = ['headline', 'shortname', 'room', 'type']
  const params_name = Object.keys(params)

  const hasAllRequired = required_params.every((param) => validator.isIn(param, params_name))
  if (!hasAllRequired) return false

  // check background color (must be an hex color if passed)
  if (params.background_color && !validator.isHexColor(params.background_color)) return false

  // check for type-specific params
  switch (params.type) {
    case 'switch':
      return validator.isInt(params.on_code) && validator.isInt(params.off_code)
    case 'alarm':
      return validator.isInt(params.trigger_code)
    case 'info':
      // no specific params needed
      return true
    case 'monitor':
      // TODO in feature release. Used by temperature sensor etc.
      return true
    default:
      return false
  }
}
