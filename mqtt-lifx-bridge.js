// Requirements
const mqtt = require('mqtt')
var LifxClient = require('node-lifx').Client
var lifx = new LifxClient()

const logging = require('./homeautomation-js-lib/logging.js')
const _ = require('lodash')

require('./homeautomation-js-lib/mqtt_helpers.js')

// Config
const set_string = '/set'
const lifxTopic = process.env.LIFX_TOPIC


lifx.on('listening', function() {
    var address = lifx.address()
    logging.info(
        'Started LIFX listening on ' +
        address.address + ':' + address.port + '\n'
    )
})


lifx.init({
    lightOfflineTolerance: 3, // A light is offline if not seen for the given amount of discoveries
    messageHandlerTimeout: 45000, // in ms, if not answer in time an error is provided to get methods
    startDiscovery: true, // start discovery after initialization
    resendPacketDelay: 150, // delay between packages if light did not receive a packet (for setting methods with callback)
    resendMaxTimes: 3, // resend packages x times if light did not receive a packet (for setting methods with callback)
    debug: false, // logs all messages in console if turned on
    address: '0.0.0.0', // the IPv4 address to bind the udp connection to
    broadcast: '255.255.255.255', // set's the IPv4 broadcast address which is addressed to discover bulbs
    lights: [] // Can be used provide a list of known light IPv4 ip addresses if broadcast packets in network are not allowed
        // For example: ['192.168.0.112', '192.168.0.114'], this will then be addressed directly
})

if (_.isNil(lifxTopic)) {
    logging.warn('LIFX_TOPIC not set, not starting')
    process.abort()
}

var connectedEvent = function() {
    client.subscribe(lifxTopic + set_string)
}

// Setup MQTT
var client = mqtt.setupClient(connectedEvent, null)

lifx.on('light-new', function(light) {
    logging.info('light new: ' + light.label + '(' + light.address + ')', Object.keys(light))
})

lifx.on('light-online', function(light) {
    logging.info('light online: ' + light.label + '(' + light.address + ')', Object.keys(light))
})

lifx.on('light-offline', function(light) {
    logging.info('light offline: ' + light.label + '(' + light.address + ')', Object.keys(light))
})

lifx.on('message', function(msg, rinfo) {
    if (typeof msg.type === 'string') {
        // Known packages send by the lights as broadcast
        switch (msg.type) {
            case 'echoResponse':
            case 'getOwner':
            case 'stateOwner':
            case 'getGroup':
            case 'getVersion':
            case 'stateGroup':
            case 'getLocation':
            case 'stateLocation':
            case 'stateTemperature':
                logging.info('known update from ' + rinfo.address, msg)
                break
            default:
                break
        }
    } else {
        // Unknown message type
        logging.info('unknown update from ' + rinfo.address, msg)
    }
})



client.on('message', (topic, message) => {
    logging.info('update: ' + {
        topic: topic,
        messages: message
    })

    const allLights = lifx.lights('')

    logging.debug('allLights: ' + typeof(allLights))

    if (_.isNil(allLights))
        return

    if (message == 1) {
        lifx.lights().forEach(function(light) {
            light.on(0, function(err) {
                if (err) {
                    logging.info('Turning light ' + light.id + ' on failed')
                }
                logging.info('Turned light ' + light.id + ' on')
            })
        })
    } else {
        lifx.lights().forEach(function(light) {
            light.off(0, function(err) {
                if (err) {
                    logging.info('Turning light ' + light.id + ' off failed')
                }
                logging.info('Turned light ' + light.id + ' off')
            })
        })
    }
})