// Requirements
const mqtt = require('mqtt')
const url = require('url')

const logging = require('./homeautomation-js-lib/logging.js')
const airscape = require('./homeautomation-js-lib/airscape.js')
const mqtt_helpers = require('./homeautomation-js-lib/mqtt_helpers.js')


// Config
const set_string = '/set'
const host = process.env.MQTT_HOST
const airscape_ip = process.env.AIRSCAPE_IP
const airscape_topic = process.env.AIRSCAPE_TOPIC

// Set up modules
logging.set_enabled(false)

// Setup MQTT
var client = mqtt.connect(host)

// MQTT Observation

client.on('connect', () => {
    logging.log('Reconnecting...\n')
    client.subscribe(airscape_topic + set_string)
})

client.on('disconnect', () => {
    logging.log('Reconnecting...\n')
    client.connect(host)
})

client.on('message', (topic, message) => {
    airscape.set_speed(parseInt(message))
})

function airscape_fan_update(result) {
    changed_keys = Object.keys(result)
    logging.log('Airscape updated: ' + changed_keys)
    changed_keys.forEach(
        function(this_key) {
            if (this_key === 'server_response')
                return

            value = result[this_key]

            if (this_key === 'fanspd') {
                mqtt_helpers.publish(client, airscape_topic, '' + value)
            } else {
                mqtt_helpers.publish(client, airscape_topic + '/' + this_key, '' + value)
            }
        }
    )
}

airscape.set_ip(airscape_ip)
airscape.set_callback(airscape_fan_update)


const healthCheckPort = process.env.HEALTH_CHECK_PORT
const healthCheckTime = process.env.HEALTH_CHECK_TIME
const healthCheckURL = process.env.HEALTH_CHECK_URL
if ( healthCheckPort !== null && healthCheckTime !== null && healthCheckURL !== null ) {
    logging.log('Starting health checks')
    health.startHealthChecks(healthCheckURL, healthCheckPort, healthCheckTime)
} else {
    logging.log('Not starting health checks')
}
