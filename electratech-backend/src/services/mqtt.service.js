const mqtt = require('mqtt');
const pool = require('../config/db');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const commandSuffix = process.env.MQTT_COMMAND_SUFFIX || '/command';

let client = null;
let connected = false;
let subscribedTopics = new Set();

async function refreshMqttSubscriptions() {
  if (!client || !connected) return;

  const result = await pool.query(
    `select mqtt_topic
     from device_components
     where is_active = true
     order by id`,
  );

  const topics = result.rows.map((row) => row.mqtt_topic);
  const nextTopics = new Set(topics);
  const topicsToSubscribe = topics.filter((topic) => !subscribedTopics.has(topic));
  const topicsToUnsubscribe = [...subscribedTopics].filter((topic) => !nextTopics.has(topic));

  if (topicsToSubscribe.length > 0) {
    client.subscribe(topicsToSubscribe, { qos: 1 }, (error) => {
      if (!error) {
        subscribedTopics = new Set([...subscribedTopics, ...topicsToSubscribe]);
      }
    });
  }

  if (topicsToUnsubscribe.length > 0) {
    client.unsubscribe(topicsToUnsubscribe, () => {
      subscribedTopics = new Set([...subscribedTopics].filter((topic) => !topicsToUnsubscribe.includes(topic)));
    });
  }
}

async function recordTelemetry(topic, payload) {
  const value = payload.toString();

  const result = await pool.query(
    `insert into iot_logs (component_id, value)
     select id, $2
     from device_components
     where mqtt_topic = $1 and is_active = true
     returning id`,
    [topic, value],
  );

  return result.rows[0] || null;
}

function startMqttBridge() {
  if (process.env.MQTT_ENABLED === 'false' || client) return;

  client = mqtt.connect(brokerUrl, {
    clientId: process.env.MQTT_CLIENT_ID || `electra_backend_${process.pid}`,
    clean: true,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    connected = true;
    void refreshMqttSubscriptions();
  });

  client.on('close', () => {
    connected = false;
  });

  client.on('message', (topic, payload) => {
    void recordTelemetry(topic, payload).catch((error) => {
      console.error(`Gagal menyimpan telemetry MQTT dari topic ${topic}:`, error.message);
    });
  });

  client.on('error', (error) => {
    console.error('Koneksi MQTT bermasalah:', error.message);
  });
}

function publishMqttCommand(component, commandId, commandValue) {
  if (!client || !connected) {
    return Promise.resolve({ published: false, reason: 'MQTT broker belum terhubung.' });
  }

  const topic = `${component.mqtt_topic}${commandSuffix}`;
  const payload = JSON.stringify({
    commandId,
    componentId: component.id,
    value: commandValue,
    issuedAt: new Date().toISOString(),
  });

  return new Promise((resolve) => {
    client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        resolve({ published: false, reason: error.message });
        return;
      }

      resolve({ published: true, topic });
    });
  });
}

module.exports = {
  publishMqttCommand,
  refreshMqttSubscriptions,
  startMqttBridge,
};
