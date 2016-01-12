var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Datastore = require('nedb');


function EventedDatastore(options) {
  var self = this;

  // Add EventEmitter capabilities
  self.__events = new EventEmitter();

  options = options || {};

  var autoLoadOption = options.autoload || false;
  options.autoload = false;

  Datastore.call(self, options);
  options.autoload = autoLoadOption;
  self.autoload = autoLoadOption;

  // Temporary properties used to collect data for event emissions
  self.__removedDocs = null;
  self.__modifications = null;

  if (self.autoload) {
    // Wait till the next tick to allow time for event listeners to be attached
    process.nextTick(function() {
      self.loadDatabase(options.onload || function (err) {
        if (err) {
          throw err;
        }
      });
    });
  }
}

util.inherits(EventedDatastore, Datastore);


EventedDatastore.prototype.on = function (eventType, listener) {
  return this.__events.on( eventType, listener );
};

EventedDatastore.prototype.once = function (eventType, listener) {
  return this.__events.once( eventType, listener );
};

EventedDatastore.prototype.listeners = function (eventType) {
  return this.__events.listeners( eventType );
};

EventedDatastore.prototype.off = function (eventType, listener) {
  return this.__events.removeListener( eventType, listener );
};

EventedDatastore.prototype._insert = function (newDoc, cb) {
  var callback = cb || function() {};

  var self = this;

  var eventedCallback = function(err, newDocs) {
    if (err) {
      return callback(err, newDocs);
    }

    var newDocsArr = util.isArray(newDocs) ? newDocs : [newDocs];

    // Ensure there are listeners registered before making a bunch of unnecessary function calls to `emit`
    if (self.listeners('inserted').length > 0) {
      newDocsArr.forEach(function(newDoc) {
        self.__events.emit('inserted', newDoc);
      });
    }

    return callback(null, newDocs);
  };

  return Datastore.prototype._insert.call(self, newDoc, eventedCallback);
};


EventedDatastore.prototype._update = function(query, updateQuery, options, cb) {
  var self = this;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  var callback = cb || function() {};

  var eventedCallback = function(err, numReplaced) {
    if (err) {
      return callback(err);
    }

    if (self.__modifications && self.__modifications.length > 0) {
      var modifications = self.__modifications;

      // Remove the temporary property
      self.__modifications = null;

      // Ensure there are listeners registered before making a bunch of unnecessary function calls to `emit`
      if (self.listeners('updated').length > 0) {
        modifications.forEach(function(mod) {
          self.__events.emit('updated', mod.newDoc, mod.oldDoc);
        });
      }
    }

    return callback(null, numReplaced);
  };

  return Datastore.prototype._update.call(self, query, updateQuery, options, eventedCallback);
};

EventedDatastore.prototype.updateIndexes = function(modifications) {
  // Add a new temporary property
  this.__modifications = modifications;

  return Datastore.prototype.updateIndexes.apply(this, arguments);
};


EventedDatastore.prototype._remove = function(query, options, cb) {
  var self = this;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  var callback = cb || function() {};

  // Add a new temporary property
  if (!self.__removedDocs) {
    self.__removedDocs = [];
  }

  var eventedCallback = function(err, numRemoved) {
    if (err) {
      return callback(err);
    }

    if (self.__removedDocs && self.__removedDocs.length > 0) {
      var removedDocs = self.__removedDocs;

      // Remove the temporary property
      self.__removedDocs = null;

      // Ensure there are listeners registered before making a bunch of unnecessary function calls to `emit`
      if (self.listeners('removed').length > 0) {
        removedDocs.forEach(function(oldDoc) {
          self.__events.emit('removed', oldDoc);
        });
      }
    }

    return callback(null, numRemoved);
  };

  return Datastore.prototype._remove.call(self, query, options, eventedCallback);
};

if (typeof Datastore.prototype._removedExpiredDocuments === 'function') {
  EventedDatastore.prototype._removeExpiredDocuments = function(docs, cb) {
    var self = this;

    var callback = cb || function() {};

    // Add a new temporary property
    if (!self.__removedDocs) {
      self.__removedDocs = [];
    }

    var eventedCallback = function(err, numExpired) {
      if (err) {
        return callback(err);
      }

      if (self.__removedDocs && self.__removedDocs.length > 0) {
        var removedDocs = self.__removedDocs;

        // Remove the temporary property
        self.__removedDocs = null;

        // Ensure there are listeners registered before making a bunch of unnecessary function calls to `emit`
        if (self.listeners('removed').length > 0) {
          removedDocs.forEach(function(oldDoc) {
            self.__events.emit('removed', oldDoc);
          });
        }
      }

      return callback(null, numExpired);
    };

    return Datastore.prototype._removeExpiredDocuments.call(self, docs, eventedCallback);
  };
}

EventedDatastore.prototype.removeFromIndexes = function(doc, cb) {
  if (this.__removedDocs) {
    if (util.isArray(doc)) {
      this.__removedDocs.push.apply(this.__removedDocs, doc);
    }
    else {
      this.__removedDocs.push(doc);
    }
  }

  return Datastore.prototype.removeFromIndexes.apply(this, arguments);
};



module.exports = EventedDatastore;
