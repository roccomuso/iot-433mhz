const EventEmitter = require('events')
const Datastore = require('@seald-io/nedb') // nedb doesn't provide listeners on DB events by default

// Wraps @seald-io/nedb's public insert/remove methods (instead of patching
// private internals, which aren't part of the fork's stable API) to emit
// 'inserted'/'removed' events with the affected document(s).
class EventedDatastore extends Datastore {
  constructor (options) {
    super(options)
    this.__events = new EventEmitter()
  }

  on (eventType, listener) {
    return this.__events.on(eventType, listener)
  }

  once (eventType, listener) {
    return this.__events.once(eventType, listener)
  }

  off (eventType, listener) {
    return this.__events.removeListener(eventType, listener)
  }

  listeners (eventType) {
    return this.__events.listeners(eventType)
  }

  insert (newDoc, callback) {
    const cb = callback || function () {}

    return super.insert(newDoc, (err, insertedDoc) => {
      if (err) return cb(err)

      if (this.__events.listeners('inserted').length > 0) {
        const insertedDocs = Array.isArray(insertedDoc) ? insertedDoc : [insertedDoc]
        insertedDocs.forEach((doc) => this.__events.emit('inserted', doc))
      }

      cb(null, insertedDoc)
    })
  }

  remove (query, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    const cb = callback || function () {}

    // nedb's remove() only returns the count of removed documents, so we
    // need to look the matching docs up beforehand to emit their content.
    super.find(query, (findErr, matchedDocs) => {
      if (findErr) return cb(findErr)

      super.remove(query, options, (err, numRemoved) => {
        if (err) return cb(err)

        if (this.__events.listeners('removed').length > 0 && numRemoved > 0) {
          const removedDocs = options.multi ? matchedDocs : matchedDocs.slice(0, numRemoved)
          removedDocs.forEach((doc) => this.__events.emit('removed', doc))
        }

        cb(null, numRemoved)
      })
    })
  }
}

module.exports = EventedDatastore
