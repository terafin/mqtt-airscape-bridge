// Requirements
const mqtt = require('mqtt')

const logging = require('./homeautomation-js-lib/logging.js')
const airscape = require('./homeautomation-js-lib/airscape.js')
const mqtt_helpers = require('./homeautomation-js-lib/mqtt_helpers.js')
const health = require('./homeautomation-js-lib/health.js')

// Config
const set_string = '/set'
const host = process.env.MQTT_HOST
const airscape_ip = process.env.AIRSCAPE_IP
const airscape_topic = process.env.AIRSCAPE_TOPIC

// Set up modules
logging.set_enabled(true)

// Setup MQTT
var client = mqtt.connect(host)

// MQTT Observation

client.on('connect', () => {
    logging.log('Reconnecting...\n')
    client.subscribe(airscape_topic + set_string)
    health.healthyEvent()
})

client.on('disconnect', () => {
    logging.log('Reconnecting...\n')
    client.connect(host)
    health.unhealthyEvent()
})

client.on('message', (topic, message) => {
    airscape.set_speed(parseInt(message))
    health.healthyEvent()
})

function airscape_fan_update(err, result) {
    if ( result === null || result === undefined ) {
        logging.log('Airscape update failed')
        health.unhealthyEvent()
        return
    }
    const changedKeys = Object.keys(result)
    logging.log('Airscape updated: ' + changedKeys)

    if ( changedKeys ===  0 || changedKeys === null  || changedKeys === undefined  ) {
        health.unhealthyEvent()
    } else {
        health.healthyEvent()
    }

    changedKeys.forEach(
        function(this_key) {
            if (this_key === 'server_response')
                return

            const value = result[this_key]

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

if ( healthCheckPort !== null && healthCheckTime !== null && healthCheckURL !== null
&& healthCheckPort !== undefined && healthCheckTime !== undefined && healthCheckURL !== undefined ) {
    logging.log('Starting health checks')
    health.startHealthChecks(healthCheckURL, healthCheckPort, healthCheckTime)
} else {
    logging.log('Not starting health checks')
}
