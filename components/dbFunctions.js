const crypto = require('crypto')

function _initializeRFcodes (data) { // data is the code received through serial
  if (typeof data === 'undefined') data = {}
  // RFcodes table structure
  return {
    code: data.code,
    bitlength: data.bitlength || 24,
    protocol: data.protocol || 1,
    isIgnored: false, // default values
    assignedTo: 'none' // attachable to a Device ID
  }
}

function _initializeCard (params, img_path) { // params received through API
  // Card table structure
  let selected_device = {}
  if (params.type === 'switch') {
    selected_device = {
      on_code: parseInt(params.on_code),
      off_code: parseInt(params.off_code),
      notification_sound: true,
      is_on: false
    }
  } else if (params.type === 'alarm') {
    selected_device = {
      last_alert: false,
      notification_sound: true,
      armed: params.armed || true,
      trigger_code: parseInt(params.trigger_code)
    }
  } else if (params.type === 'info') { selected_device = {} }

  return {
    active: true,
    date: Math.floor(Date.now() / 1000),
    headline: params.headline,
    shortname: params.shortname.trim().toLowerCase().replace(/ /g, '-'),
    card_body: params.card_body,
    background_color: params.background_color || '#FAFAFA',
    img: img_path || false, // false if card got no img.
    room: params.room.trim().toLowerCase().replace(/ /g, '-'),
    type: params.type,
    device: selected_device
  }
}

function _initializeDBSettings () {
  // return settings DB structure
  return {
    telegram: {
      notification_enabled: false,
      iot_uid: false
    },
    email: {
      notification_enabled: false,
      recipient_email: false
    }
  }
}

// Thin Promise wrappers around the callback-based nedb API. We deliberately
// go through the plain callback methods (not the datastore's own
// find/insert/updateAsync helpers) so that EventedDatastore's 'inserted' and
// 'removed' events keep firing for insert()/remove() calls.
function findAsync (collection, query) {
  return new Promise((resolve, reject) => {
    collection.find(query, (err, docs) => (err ? reject(err) : resolve(docs)))
  })
}

function findSortedAsync (collection, query, sort) {
  return new Promise((resolve, reject) => {
    collection.find(query).sort(sort).exec((err, docs) => (err ? reject(err) : resolve(docs)))
  })
}

function insertAsync (collection, doc) {
  return new Promise((resolve, reject) => {
    collection.insert(doc, (err, newDoc) => (err ? reject(err) : resolve(newDoc)))
  })
}

function updateAsync (collection, query, update, options) {
  return new Promise((resolve, reject) => {
    collection.update(query, update, options || {}, (err, numAffected) => (err ? reject(err) : resolve(numAffected)))
  })
}

function removeAsync (collection, query, options) {
  return new Promise((resolve, reject) => {
    collection.remove(query, options || {}, (err, numRemoved) => (err ? reject(err) : resolve(numRemoved)))
  })
}

module.exports = function (db, config) {
  // exposed methods
  const methods = {
    putCodeInDB: async function (data) {
      // check if the given code is already in DB, if not, put it.
      const doc = await findAsync(db.RFCODES, { code: data.code })
      if (doc.length !== 0) return 'Code already exists in DB' // already exists
      return insertAsync(db.RFCODES, _initializeRFcodes(data))
    },
    isCodeIgnored: async function (code) {
      const doc = await findAsync(db.RFCODES, { code: code, isIgnored: true })
      return doc.length !== 0
    },
    isCodeAvailable: async function (code) {
      const docs = await findAsync(db.RFCODES, { code: code, isIgnored: false })

      if (docs.length === 0) throw new Error('no code found')
      if (docs.length === 1 && docs[0].assignedTo === 'none') return { isAvailable: true, assignedTo: docs[0].assignedTo }
      if (docs.length === 1 && docs[0].assignedTo !== 'none') return { isAvailable: false, assignedTo: docs[0].assignedTo }
      throw new Error('More than one code reference in DB')
    },
    getAvailableCodes: function () {
      return findAsync(db.RFCODES, { isIgnored: false, assignedTo: 'none' })
    },
    ignoreCode: function (code, val) {
      return updateAsync(db.RFCODES, { code: code }, { $set: { isIgnored: val } }) // numReplaced (1)
    },
    getIgnoredCodes: function () {
      return findAsync(db.RFCODES, { isIgnored: true })
    },
    getAllCodes: function () {
      return findAsync(db.RFCODES, {})
    },
    getAllCards: function () {
      return findSortedAsync(db.CARDS, {}, { date: -1 })
    },
    getCard: function (identifiers) {
      if (!Object.hasOwn(identifiers, '_id') && !Object.hasOwn(identifiers, 'shortname')) return Promise.reject(new Error('No valid parameters.'))
      return findAsync(db.CARDS, identifiers)
    },
    checkDatabaseCorrispondence: async function (params) {
      // CHECK THAT:
      // shortname is unique
      // codes are in db.RFCODES
      const doc = await findAsync(db.CARDS, { shortname: params.shortname })
      if (doc.length !== 0) throw new Error('shortname already exists in DB, choose another one.')

      // check for codes
      let query = {}
      if (params.type === 'switch') query = { $or: [{ code: parseInt(params.on_code), isIgnored: false, assignedTo: 'none' }, { code: parseInt(params.off_code), isIgnored: false, assignedTo: 'none' }] }
      else if (params.type === 'alarm') query = { code: parseInt(params.trigger_code), isIgnored: false, assignedTo: 'none' }
      else if (params.type === 'info') return true

      const codes = await findAsync(db.RFCODES, query)
      const len = (params.type === 'switch') ? 2 : 1 // should have found 2 records in codes' DB for switch type
      if (codes.length !== len) throw new Error('Make sure to assign free not Ignored existing codes.')
      return true
    },
    putCardInDatabase: async function (req, destination_path) {
      // req.body e req.file
      const newDoc = await insertAsync(db.CARDS, _initializeCard(req.body, destination_path))

      // set as assigned the codes in DB (handles both 'switch' and 'alarm' type)
      // NB. must match the normalized shortname stored on the card itself (see _initializeCard),
      // otherwise assignedTo would reference a shortname no card actually has.
      try {
        await updateAsync(
          db.RFCODES,
          { $or: [{ code: parseInt(req.body.on_code) }, { code: parseInt(req.body.off_code) }, { code: parseInt(req.body.trigger_code) }] },
          { $set: { assignedTo: newDoc.shortname } },
          { multi: true }
        )
      } catch (err) {
        console.error('putCardInDatabase: error assigning codes to the new card', err)
      }

      return newDoc // return the new Card just inserted
    },
    initDBCards: async function (demo_cards) {
      // put default demo cards in DB if it's empty
      const cards = await methods.getAllCards()
      if (cards.length) return cards
      return insertAsync(db.CARDS, demo_cards)
    },
    getDBSettings: function () {
      return findAsync(db.SETTINGS, {})
    },
    initDBSettings: async function () {
      const settings = await methods.getDBSettings()
      if (settings.length) return settings
      // no settings, let's init settings DB
      return insertAsync(db.SETTINGS, _initializeDBSettings())
    },
    generateNewUID: async function () {
      // generate and save a new IoT UID.
      const new_uid = crypto.randomBytes(20).toString('hex')
      const numReplaced = await updateAsync(db.SETTINGS, {}, { $set: { 'telegram.iot_uid': new_uid } })
      if (numReplaced !== 1) throw new Error('error saving the new IoT UID')
      return new_uid
    },
    getIotUID: async function () {
      // get IoT UID from DB, if it doesn't exist let's create one:
      const docs = await findAsync(db.SETTINGS, {})
      if (docs.length !== 1) throw new Error('No DB Structure found')

      const uid = docs[0].telegram.iot_uid
      if (uid === false) return methods.generateNewUID() // doesn't exist yet, generate, save and return it
      return uid // already exists, return it
    },
    deleteCard: function (identifiers) {
      // delete a single card, given his _id or shortname.
      if (!Object.hasOwn(identifiers, '_id') && !Object.hasOwn(identifiers, 'shortname')) return Promise.reject(new Error('No valid parameters.'))
      return removeAsync(db.CARDS, identifiers, {})
      // NB. the listener in index.js will delete the attached codes.
    },
    getSwitchCodes: async function (card_id) {
      // get the switch codes for the specified card _id
      const docs = await findAsync(db.CARDS, { _id: card_id })
      if (!docs.length) throw new Error('no records found')

      const card = docs[0]
      if (card.type !== 'switch') throw new Error('Misleading card type.')
      return { on_code: card.device.on_code, off_code: card.device.off_code, sound: card.device.notification_sound }
    },
    getSwitchStatus: async function (identifiers) {
      // get switch status, given card _id or shortname.
      if (!Object.hasOwn(identifiers, '_id') && !Object.hasOwn(identifiers, 'shortname')) throw new Error('No valid parameters.')
      identifiers.type = 'switch'
      const docs = await findAsync(db.CARDS, identifiers)
      if (docs.length === 0) throw new Error('No card found for given identifiers')
      return docs[0].device.is_on
    },
    setSwitchStatus: function (card_id, is_on) {
      return updateAsync(db.CARDS, { _id: card_id }, { $set: { 'device.is_on': is_on } })
    },
    alarmTriggered: async function (cardShortname, type) {
      // check if it is an alarm card
      const docs = await findAsync(db.CARDS, { shortname: cardShortname, type: type })
      if (!docs.length) return undefined

      // it is an alarm card, update the DB last_alert field
      const timestamp = Math.floor(Date.now() / 1000)
      const numReplaced = await updateAsync(db.CARDS, { shortname: cardShortname }, { $set: { 'device.last_alert': timestamp } })
      if (!numReplaced) throw new Error('error updating last_alert')

      docs[0].device.last_alert = timestamp
      return docs[0]
    },
    muteCard: async function (card_id) {
      // mute/unmute a card
      const docs = await findAsync(db.CARDS, { _id: card_id })
      if (!docs.length) throw new Error(`error: no card found with _id ${card_id}`)

      const new_val = !docs[0].device.notification_sound
      const affected = await updateAsync(db.CARDS, { _id: card_id }, { $set: { 'device.notification_sound': new_val } })
      if (affected !== 1) throw new Error('error: no value updated')
      return new_val
    },
    armCard: async function (identifiers) {
      // arm/disarm alarm type card
      if (!Object.hasOwn(identifiers, '_id') && !Object.hasOwn(identifiers, 'shortname')) throw new Error('No valid parameters.')
      const query = Object.hasOwn(identifiers, '_id') ? { _id: identifiers._id } : { shortname: identifiers.shortname }
      query.type = 'alarm'

      const docs = await findAsync(db.CARDS, query)
      if (!docs.length) throw new Error(`error: no card found with given identifiers ${JSON.stringify(identifiers)}`)

      let new_val = !docs[0].device.armed
      if (typeof identifiers.arm === 'boolean') new_val = identifiers.arm // for api arm/disarm requests
      const affected = await updateAsync(db.CARDS, query, { $set: { 'device.armed': new_val } })
      if (affected !== 1) throw new Error('error: no value updated')
      return { card_id: docs[0]._id, affected: affected, is_armed: new_val }
    },
    armDisarmAll: async function (arm) {
      // arm/disarm all Alarm type cards.
      const affected = await updateAsync(db.CARDS, { type: 'alarm' }, { $set: { 'device.armed': arm } }, { multi: true })
      return { affected: affected || 0 }
    },
    toggleTelegram: async function (status) {
      // enable/disable telegram notification
      if (typeof status !== 'boolean') throw new Error('toggleTelegram: boolean expected')
      const numReplaced = await updateAsync(db.SETTINGS, {}, { $set: { 'telegram.notification_enabled': status } })
      if (numReplaced !== 1) throw new Error('Error: Zero or More than one telegram entry modified in settings.')
      return status
    },
    toggleEmail: async function (status) {
      // enable/disable Email notification
      if (typeof status !== 'boolean') throw new Error('toggleEmail: boolean expected')
      const numReplaced = await updateAsync(db.SETTINGS, {}, { $set: { 'email.notification_enabled': status } })
      if (numReplaced !== 1) throw new Error('Error: Zero or More than one Email entry modified in settings.')
      return status
    },
    isTelegramEnabled: async function () {
      // check whether telegram is enabled or disabled.
      const docs = await findAsync(db.SETTINGS, { 'telegram.notification_enabled': true })
      return docs.length > 0
    }
  }

  return methods
}
