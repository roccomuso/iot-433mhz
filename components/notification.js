const config = require('../config.json')
const debug = require('./debug.js')()

async function _getRemoteUrl (url_name) {
  const response = await fetch(config.backend_urls)
  if (!response.ok) throw new Error(`Can't fetch remote urls list: HTTP ${response.status}`)

  const data = await response.json()
  if (url_name in data) return data[url_name]
  throw new Error("Can't get the remote URL")
}

async function _postRequestJSON (url, json_data, uid) {
  // always attach the uid as entrypoint.
  const response = await fetch(`${url}/${uid}`, {
    method: 'POST',
    headers: { 'cache-control': 'no-cache', 'Content-Type': 'application/json' },
    body: JSON.stringify(json_data)
  })
  if (!response.ok) throw new Error(`HTTP failed: ${response.status}`)
  return response.text()
}

module.exports = function (dbFunctions, webHooks) {
  let t = +new Date()

  const methods = {
    adviceTelegram: async function (card) {
      // advise user through telegram
      const outcome = await dbFunctions.isTelegramEnabled()
      if (!outcome) {
        debug('Telegram Notification disabled. Menu > Settings.')
        return card
      }

      const url = await _getRemoteUrl('telegram_backend')
      const uid = await dbFunctions.getIotUID()
      const body = await _postRequestJSON(url, card, uid)
      debug('Telegram Notification sent! - Server responded with:', body)
      return card
    },
    adviceEmail: async function (card) {
      // TODO
      return card
    },
    adviceWebHook: async function (card) {
      // WebHook call (alarm triggered)
      webHooks.trigger('alarmTriggered', card)
      return card
    },
    alarmAdviseAll: async function (card) {
      // advise telegram, email, webhooks
      const now = +new Date()
      const elapsed = now - t
      if (elapsed <= config.notificationDelay * 1000) {
        debug('Notification delayed') // 1 notification every 5 sec
        return
      }

      t = now
      try {
        await methods.adviceEmail(card)
        await methods.adviceTelegram(card)
        await methods.adviceWebHook(card)
      } catch (err) {
        console.error(err)
      }
    },
    webHookCodeDetected: function (codeData) {
      // webHook call (code detected)
      webHooks.trigger('newCode', codeData)
    }
  }

  // expose methods
  return methods
}
