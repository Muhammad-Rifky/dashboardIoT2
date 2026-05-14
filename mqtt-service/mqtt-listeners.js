const mqtt = require("mqtt");
const mysql = require("mysql2");
const http = require("http");
const express = require("express");

const { init, sendSensorData, sendDeviceStatus } = require("./socket-server");

// =========================
// CONFIG
// =========================
const MQTT_BROKER = "mqtt://76.13.192.195:1883";

// =========================
// MQTT CLIENT
// =========================
const client = mqtt.connect(MQTT_BROKER, {
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 2000,
});

// =========================
// MYSQL CONNECTION
// =========================
const db = mysql.createPool({
  host: "localhost",
  user: "iotuser",
  password: "123456",
  database: "iot_system",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z", // 🔥 IMPORTANT: pakai UTC
});

// =========================
// HTTP + SOCKET SERVER
// =========================
const server = http.createServer();
init(server);

// =========================
// EXPRESS API
// =========================
const app = express();
app.use(express.json());

app.post("/publish", (req, res) => {
  const { topic, message } = req.body;

  console.log("📨 NEXT REQUEST:", topic, message);

  if (!topic || !message) {
    return res.status(400).json({
      success: false,
      message: "topic & message wajib",
    });
  }

  client.publish(topic, message, (err) => {
    if (err) {
      console.log("❌ MQTT PUBLISH FAIL:", err);
      return res.status(500).json({
        success: false,
        message: "publish gagal",
      });
    }

    console.log("✅ MQTT SENT:", topic);
    res.json({ success: true });
  });
});

server.on("request", app);

// =========================
// START SERVER
// =========================
server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});

// =========================
// MQTT EVENTS
// =========================
client.on("connect", () => {
  console.log("✅ MQTT CONNECTED TO:", MQTT_BROKER);

  client.subscribe("iot/#", (err) => {
    if (err) {
      console.log("❌ SUBSCRIBE ERROR:", err);
    } else {
      console.log("📡 SUBSCRIBED: iot/#");
    }
  });
});

client.on("error", (err) => {
  console.log("❌ MQTT ERROR:", err.message);
});

client.on("reconnect", () => {
  console.log("🔄 MQTT RECONNECTING...");
});

// =========================
// MQTT MESSAGE HANDLER
// =========================
client.on("message", (topic, message) => {
  console.log("\n📩 TOPIC:", topic);
  console.log("📦 RAW:", message.toString());

  let data;

  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.log("❌ JSON ERROR:", err.message);
    return;
  }

  // =========================
  // HEARTBEAT
  // =========================
  if (topic === "iot/heartbeat") {
    console.log("💓 HEARTBEAT:", data.device_id);

    db.query(
      `UPDATE devices 
       SET last_seen = UTC_TIMESTAMP()
       WHERE device_id = ?`,
      [data.device_id],
      (err) => {
        if (err) console.log("❌ DB ERROR HEARTBEAT:", err);
        else console.log("✅ DEVICE UPDATED (heartbeat - UTC)");
      }
    );

    return;
  }

  // =========================
  // SENSOR DATA
  // =========================
  if (topic === "iot/sensor") {
    console.log("📊 SENSOR:", data.device_id);

    db.query(
      `INSERT INTO sensor_data 
       (device_id, ph, tds, suhu, turbidity_adc, turbidity_status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.device_id,
        data.ph,
        data.tds,
        data.suhu,
        data.turbidity_adc,
        data.turbidity_status,
      ],
      (err) => {
        if (err) console.log("❌ DB ERROR SENSOR:", err);
        else console.log("✅ SENSOR SAVED");
      }
    );

    db.query(
      `UPDATE devices 
       SET last_seen = UTC_TIMESTAMP()
       WHERE device_id = ?`,
      [data.device_id],
      (err) => {
        if (err) console.log("❌ DB ERROR UPDATE DEVICE:", err);
        else console.log("✅ DEVICE UPDATED (sensor - UTC)");
      }
    );

    sendSensorData(data);
  }
});
