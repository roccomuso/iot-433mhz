var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var debug = require('debug')('test-suite');
var http = require('http');
var fs = require('fs');
var path = require('path');
var iot;
var emitter;

// IMPLEMENTED TESTS:

/*

 # Start
  - Should start iot-433mhz.

 # Auth
  - Should not authenticate with wrong login credentials
  - Should authenticate with right login credentials

 # Serial Port
  - Should open the virtual serial port.
  - Should send a command over serial and get a response.

  # Socket
   - Should enstablish a socket.io connection

  # API
    /api/settings/get  -  get
    /api/system/get/uid  -  get
    /api/system/new/uid  -  get
    /api/system/telegram/enable  -  get
    /api/system/telegram/disable  -  get
    /api/system/email/enable  -  get
    /api/system/email/disable  -  get
    /api/code/send/:code  -  get
    /api/codes/ignored  -  get
    /api/codes/all  -  get
    /api/codes/available  -  get
    /api/cards/all  -  get
    /api/cards/get/:shortname  -  get
    /api/cards/delete/:shortname  -  get
    /api/cards/arm-all  - post
    /api/cards/disarm-all  - post
    /api/alarm/:shortname/arm  -  get
    /api/alarm/:shortname/disarm  -  get
    /api/switch/:shortname/on  -  get
    /api/switch/:shortname/off  -  get
    /api/switch/:shortname/toggle  -  get
    /api/webhook/get  -  get
    /api/webhook/get/:webHookShortname  -  get
    /api/webhook/add/:webHookShortname  - post
    /api/webhook/delete/:webHookShortname  -  get
    /api/webhook/delete/:webHookShortname  - post
    /api/webhook/trigger/:webHookShortname  - post

   # UI (API & Socket.io conn.)
    - Should send a random code (and have socket.io getting it)
    - Should ...


*/


describe('Auth >', function() {

    before(function(done) {
        // TODO
        iot = require('../index');
        done();

    });

    it('...', function(done) {
        // TODO
        done();
    });

});

describe('Serial Port >', function(){

    after(function(done) {
        // TODO
        done();
    });

});
