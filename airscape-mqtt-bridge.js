// Requirements
mqtt = require('mqtt')
url = require('url')

logging = require('./homeautomation-js-lib/logging.js')
airscape = require('./homeautomation-js-lib/airscape.js')
mqtt_helpers = require('./homeautomation-js-lib/mqtt_helpers.js')


// Config
set_string = "/set"
host = process.env.MQTT_HOST
airscape_ip = process.env.AIRSCAPE_IP
airscape_topic = process.env.AIRSCAPE_TOPIC

// Set up modules
logging.set_enabled(false)

// Setup MQTT
client = mqtt.connect(host)

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
    logging.log("Airscape updated: " + changed_keys)
    changed_keys.forEach(
        function(this_key) {
            if (this_key === 'server_response')
                return

            value = result[this_key]

            if (this_key === 'fanspd') {
                mqtt_helpers.publish(client, airscape_topic, "" + value)
            } else {
                mqtt_helpers.publish(client, airscape_topic + "/" + this_key, "" + value)
            }
        }
    )
}

airscape.set_ip(airscape_ip)
airscape.set_callback(airscape_fan_update)