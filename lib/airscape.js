const logging = require('homeautomation-js-lib/logging.js')
const _ = require('lodash')
const request = require('request')
const EventEmitter = require('events')
const interval = require('interval-promise')
const xml_parser = require('xml2js')
var current_speed = null

const pollTime = 5
const airscapeIP = process.env.AIRSCAPE_IP

if (_.isNil(airscapeIP)) {
    logging.warn('AIRSCAPE_IP not set, not starting')
    process.abort()
}

module.exports = new EventEmitter()

module.exports.off = function() {
    send_airscape_request(4, null)
}

module.exports.setSpeed = function(target_speed) {
    logging.info('Targeting speed: ' + target_speed)
    if (current_speed == target_speed) {
        logging.info('Same speed, bailing')
        return
    }
    current_speed = target_speed

    this.off()

    if (target_speed == 0) {
        return
    }

    interval(async() => {
        speedUp()
        logging.info('upping speed')
    }, 1000, { iterations: target_speed })
}

const send_airscape_request = function(command, callback) {
    var airscape_url = 'http://' + airscapeIP + '/fanspd.cgi'

    if (!_.isNil(command)) {
        airscape_url = airscape_url + '?dir=' + command
    }

    logging.info('request url: ' + airscape_url)
    request(airscape_url, function(error, response, body) {
        if (!_.isNil(error)) {
            logging.error('error:' + error)
            logging.error('response:' + response)
            logging.error('body:' + body)
        }

        if (!_.isNil(callback)) {
            return callback(error, body)
        }
    })
}

const checkFan = function() {
    logging.debug('Checking fan...')

    send_airscape_request(null, function(error, body) {
        if (!_.isNil(error)) {
            return
        }
        var body_list = null
        var fixed_lines = null
        var fixed_body = null

        try {
            body_list = body.split('\n')
            fixed_lines = body_list.map(function(line) {
                return line.substr(line.indexOf('<'))
            })
            fixed_body = fixed_lines.join('\n')
            fixed_body = '<?xml version="1.0" encoding="utf-8"?>\n<root>\n' + fixed_body + '</root>'
        } catch (err) {
            logging.error('error: ' + err)
        }

        logging.debug('fixed_body: ' + fixed_body)
        xml_parser.parseString(fixed_body, { trim: true, normalize: true, normalizeTags: true }, function(err, result) {
            try {
                if ( !_.isNil(result)) {
                    logging.debug('result: ' + Object.keys(result))
                    var callback_value = (!_.isNil(result) && !_.isNil(result.root)) ? result.root : null
                    if (!_.isNil(callback_value) && !_.isNil(result.root)) {
                        current_speed = result.root.fanspd
                    }

                    if (!_.isNil(callback_value)) {
                        module.exports.emit('fan-updated', callback_value)
                    }
                } else {
                    logging.error('empty result error: ' + err)
                }
            } catch (err) {
                logging.error('callback error: ' + err)
            }
        })
    })
}

const startMonitoring = function() {
    logging.info('Starting to monitor: ' + airscapeIP)
    interval(async() => {
        checkFan()
    }, pollTime * 1000)
}

const speedUp = function() {
    logging.debug('... upping speed')
    send_airscape_request(1, null)
}

startMonitoring()