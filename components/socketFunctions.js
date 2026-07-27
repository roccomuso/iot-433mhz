const debug = require('./debug.js')()

// For socket sending methods see http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io

module.exports = function (io, rf433mhz, dbFunctions) {
  const clients = [] // Store sockets

  // private methods
  const _methods = {

    onGetInitCards: function (socket_id) {
      clients.forEach(function (sock) {
        if (sock.id === socket_id) {
          // Sending the cards stored in db.CARDS
          methods.asyncEmitInitCards(sock)
        }
      })
    },
    onIgnoreCode: async function (code) {
      // ignore the specified code, isIgnored = true in DB
      try {
        await dbFunctions.ignoreCode(code, true)
        debug('code ignored: ', code)
      } catch (err) {
        console.error(err)
      }
    },
    onRemoveIgnoreCode: async function (code) {
      // make the code no more ignored (putting isIgnored = false)
      try {
        await dbFunctions.ignoreCode(code, false)
        debug('code no more ignored: ', code)
      } catch (err) {
        console.error(err)
      }
    },
    onSwitchCommuted: async function (data) {
      // send the RF code | data = {card_id: '...', set: 'on/off'}
      try {
        const switch_codes = await dbFunctions.getSwitchCodes(data.card_id)
        const codeToSend = (data.set === 'on') ? switch_codes.on_code : switch_codes.off_code
        const is_on = (data.set === 'on')

        rf433mhz.send(codeToSend, function (err, out) {
          if (err) return console.log('Error:', err)
          debug('Code ' + codeToSend + ' sent!')
          // let's commute the switch on UI
          io.emit('uiSwitchToggle', { card_id: data.card_id, set: is_on, sound: switch_codes.sound })
          // save it on DB
          dbFunctions.setSwitchStatus(data.card_id, is_on).then(function (numDocs) {
            debug('DB records updated:', numDocs)
          }, function (err) { console.error(err) })
        })
      } catch (err) {
        console.error(err)
      }
    },
    onDeviceShake: function () {
      debug('Randomizing Cards on the UI')
      io.emit('randomizeCards')
    },
    onDeleteCard: async function (_id) {
      // delete the card with the given _id
      try {
        await dbFunctions.deleteCard({ _id: _id })
        // UI refreshed by db.CARDS on Remove listener in index.js
      } catch (err) {
        if (err) console.error(err)
      }
    },
    onMuteCard: async function (_id) {
      // mute/unmute card
      try {
        const result = await dbFunctions.muteCard(_id)
        // update every UI
        io.emit('uiMuteStatus', { card_id: _id, notification_sound: result })
      } catch (err) {
        if (err) console.error(err)
      }
    },
    onArmDisarm: async function (_id) {
      // arm/disarm card
      try {
        const result = await dbFunctions.armCard({ _id: _id })
        // update every UI
        io.emit('uiArmStatus', { card_id: _id, is_armed: result.is_armed })
      } catch (err) {
        if (err) console.error(err)
      }
    }
  }

  // exposed methods
  const methods = {

    onConnection: function (client_socket) { // single user socket
      debug('Client connected via socket.io:', client_socket.id)

      // Save the user:
      clients.push(client_socket)
      client_socket.on('disconnect', function () {
        clients.splice(clients.indexOf(client_socket), 1)
        debug('Client disconnected:', client_socket.id)
        // remaining clients
        // clients.forEach(function(sckt){ console.log(sckt.id);} );
      })

      // Sending the cards stored in db.CARDS
      methods.asyncEmitInitCards(client_socket)

      // Listen for socket events
      client_socket.on('shakeOccurred', _methods.onDeviceShake)
      client_socket.on('getInitCards', _methods.onGetInitCards)
      client_socket.on('ignoreCode', _methods.onIgnoreCode)
      client_socket.on('removeIgnoreCode', _methods.onRemoveIgnoreCode)
      client_socket.on('switchCommuted', _methods.onSwitchCommuted)
      client_socket.on('deleteCard', _methods.onDeleteCard)
      client_socket.on('muteCard', _methods.onMuteCard)
      client_socket.on('arm_disarm', _methods.onArmDisarm)
    },
    asyncEmitInitCards: async function (socket) {
      try {
        const cards = await dbFunctions.getAllCards()
        if (socket) socket.emit('initCards', cards)
        else io.emit('initCards', cards)
      } catch (err) {
        console.error(err)
      }
    }

  }

  return methods
}
