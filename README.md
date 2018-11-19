
# AirScape Fan <-> MQTT Bridge

## Required environment variables

| ENV VARIABLE        | EXAMPLE                                              |                 |
|---------------------| -----------------------------------------------------| --------------- |
| MQTT_HOST           | "mqtt://your-mqtt.server.here"                       | **REQUIRED**    |
| MQTT_USER           | "mqtt username"                                      | *OPTIONAL*      |
| MQTT_PASS           | "mqtt username"                                      | *OPTIONAL*      |
| TOPIC_PREFIX        | "/your/topic/prefix"                                 | **REQUIRED**    |
| AIRSCAPE_IP         | YOUR.AIRSCAPE.IP.OR.HOSTNAME                         | **REQUIRED**    |

## Example Usage

Here's a full docker flow you can use to pull the latest image, delete the old one, and create a new container named 'mqtt-airscape-bridge':

* `docker pull terafin/mqtt-airscape-bridge:latest`
* `docker rm -f mqtt-airscape-bridge`
* `docker run -d -e TOPIC_PREFIX='/home/airscape' -e AIRSCAPE_IP='10.0.1.100' -e MQTT_HOST='mqtt://mymqtt.local.address' --name='mqtt-airscape-bridge' terafin/mqtt-airscape-bridge:latest`


This will spin up a working airscape bridge to a device at IP 10.0.1.100, which will start sending the MQTT messages below

To look at the logging output, you can:

* `docker logs -f mqtt-airscape-bridge`

## MQTT Output

Here's some sample (from my system) results after using the above setup:

*Note: These will be polled and updated every 5 seconds.*

    /environment/house_fan/attic_temp 80
    /environment/house_fan/house_temp 77
    /environment/house_fan/doorinprocess 0
    /environment/house_fan/timeremaining 0
    /environment/house_fan/macaddr XX:XX:XX:XX:XX:XX
    /environment/house_fan/ipaddr 10.0.90.16
    /environment/house_fan/model 5.0eWHF
    /environment/house_fan/softver 2.15.1
    /environment/house_fan/interlock1 0
    /environment/house_fan/interlock2 0
    /environment/house_fan/cfm 0
    /environment/house_fan/power 0
    /environment/house_fan/dns1 10.0.90.1
    /environment/house_fan/oa_temp -99
    /environment/house_fan/dips 11000
    /environment/house_fan/switch2 1111
    /environment/house_fan/setpoint 0
    /environment/house_fan 0

## MQTT Commands

### Set Fan Speed to Off

    /environment/house_fan/set 0

### Set Fan Speed to 3

    /environment/house_fan/set 3
