const mqtt = require("mqtt");
const mysql = require("mysql2");
const http = require("http");
const express = require("express");

const { init, sendSensorData, sendDeviceStatus } = require("./socket-server");

// =======================
// SERVER (HTTP + WEBSOCKET)
// =======================
const server = http.createServer();
init(server);

// =======================
// EXPRESS (API)
// =======================
const app = express();
app.use(express.json());

// 🔥 ENDPOINT UNTUK NEXT.JS (PENTING)
app.post("/publish", (req, res) => {
  const { topic, message } = req.body;

  console.log("📨 REQUEST DARI NEXT:", topic, message);

  if (!topic || !message) {
    return res.status(400).json({
      success: false,
      message: "Topic dan message wajib diisi"
    });
  }

  client.publish(topic, message, () => {
    console.log("✅ MQTT TERKIRIM:", topic, message);

    res.json({
      success: true,
      message: "Message published"
    });
  });
});

// 🔥 GABUNGKAN EXPRESS KE HTTP SERVER
server.on("request", app);

// =======================
// START SERVER
// =======================
server.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});

// =======================
// MQTT CONNECT
// =======================
const client = mqtt.connect("mqtt://localhost:1883");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "iotuser",
  password: "123456",
  database: "iot_system"
});

client.on("connect", () => {
  console.log("✅ MQTT Connected");

  client.subscribe("iot/sensor");
  client.subscribe("iot/heartbeat");
});

// =======================
// HANDLE MQTT MESSAGE
// =======================
client.on("message", (topic, message) => {
  console.log("📩 TOPIC:", topic);
  console.log("📦 MESSAGE:", message.toString());

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.log("❌ JSON ERROR:", err);
    return;
  }

  // ===== HEARTBEAT =====
  if (topic === "iot/heartbeat") {
    console.log("🔥 HEARTBEAT MASUK:", data.device_id);

    db.query(
      `UPDATE devices 
       SET status='online', last_seen=NOW()
       WHERE device_id=?`,
      [data.device_id],
      (err, result) => {
        if (err) console.log("❌ DB ERROR:", err);
        else console.log("✅ HEARTBEAT UPDATE:", result);
      }
    );

    return;
  }

  // ===== SENSOR =====
  if (topic === "iot/sensor") {
    console.log("📊 SENSOR MASUK:", data.device_id);

    db.query(
      `INSERT INTO sensor_data
       (device_id, ph, tds, suhu, turbidity)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.device_id,
        data.ph,
        data.tds,
        data.suhu,
        data.turbidity
      ],
      (err, result) => {
        if (err) console.log("❌ DB ERROR:", err);
        else console.log("✅ SENSOR DATA INSERTED:", result);
      }
    );

    db.query(
      `UPDATE devices 
       SET status='online', last_seen=NOW()
       WHERE device_id=?`,
      [data.device_id]
    );

    sendSensorData(data);
  }
});