const mqtt = require("mqtt");
const mysql = require("mysql2");
const http = require("http");

const { init, sendSensorData, sendDeviceStatus } = require("./socket-server");

const server = http.createServer();
init(server);

server.listen(3001, () => {
  console.log("WebSocket running on port 3001");
});

const client = mqtt.connect("mqtt://192.168.1.18:1883");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "iot_system"
});

client.on("connect", () => {
  console.log("✅ MQTT Connected");

  client.subscribe("iot/sensor");
  client.subscribe("iot/heartbeat");
});

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
       (device_id, ph, suhu, tds, turbidity)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.device_id,
        data.ph,
        data.suhu,
        data.tds,
        data.turbidity
      ]
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