require("dotenv").config();
const mqtt = require("mqtt");
const mysql = require("mysql2");
const http = require("http");
const express = require("express");

const { init, sendSensorData, sendDeviceStatus } = require("./socket-server");
const { sendEmail } = require("./email");

// =========================
// CONFIG
// =========================
const MQTT_BROKER = "mqtt://76.13.192.195:1883"; 
// 👆 GANTI INI SESUAI IP LAPTOP KAMU

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
  user: "root",
  password: "",
  database: "iot_system",
  waitForConnections: true,
  connectionLimit: 10,
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

// 🔥 endpoint dari Next.js
app.post("/publish", (req, res) => {
  const { topic, message } = req.body;

  console.log("📨 NEXT REQUEST:", topic, message);

  if (!topic || !message) {
    return res.status(400).json({
      success: false,
      message: "topic & message wajib"
    });
  }

  client.publish(topic, message, (err) => {
    if (err) {
      console.log("❌ MQTT PUBLISH FAIL:", err);
      return res.status(500).json({
        success: false,
        message: "publish gagal"
      });
    }

    console.log("✅ MQTT SENT:", topic, message);

    res.json({
      success: true,
      message: "published"
    });
  });
});

// attach express ke http server
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
function getWaterStatus(ph, suhu, tds, turbidity) {

  let score = 0;

  // pH ideal 6.5 - 8.5
  if (ph < 6 || ph > 9) {
    score += 2;
  } else if (ph < 6.5 || ph > 8.5) {
    score += 1;
  }

  // suhu ideal 25 - 32
  if (suhu < 20 || suhu > 35) {
    score += 2;
  } else if (suhu < 25 || suhu > 32) {
    score += 1;
  }

  // TDS ideal < 500
  if (tds > 1000) {
    score += 2;
  } else if (tds > 500) {
    score += 1;
  }

  // turbidity
  if (turbidity === "sangat_keruh") {
    score += 2;
  } else if (turbidity === "keruh") {
    score += 1;
  }

  // hasil akhir
  if (score <= 1) return "Aman";
  if (score <= 3) return "Perlu Perhatian";

  return "Bahaya";
}
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
       SET last_seen=NOW(), 
       is_notified_offline=0
       WHERE device_id=?`,
      [data.device_id],
      (err) => {
        if (err) console.log("❌ DB ERROR HEARTBEAT:", err);
        else console.log("✅ DEVICE UPDATED (heartbeat)");
      }
    );

    return;
  }
  // =========================
  // STATUS
  // =========================
  if (topic === "iot/status") {
  console.log("📡 STATUS:", data.device_id, data.status);

    db.query(
      `
      UPDATE devices
      SET status = ?
      WHERE device_id = ?
      `,
      [data.status, data.device_id],
      (err) => {
        if (err) {
          console.log("❌ DB STATUS ERROR:", err);
        } else {
          console.log("✅ DEVICE STATUS UPDATED");
        }
      }
    );

    sendDeviceStatus(data);

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
      data.turbidity_status
    ],
    (err) => {
      if (err) console.log("❌ DB ERROR SENSOR:", err);
      else console.log("✅ SENSOR SAVED");
    }
  );

  db.query(
    `UPDATE devices 
     SET last_seen = NOW(), is_notified_offline = 0
     WHERE device_id = ?`,
    [data.device_id]
  );

  sendSensorData(data);
  
  db.query(
  `
  SELECT 
    u.email,
    d.name
  FROM devices d
  JOIN users u ON d.user_id = u.id
  WHERE d.device_id = ?
  `,
  [data.device_id],
  async (err, result) => {

    if (err || result.length === 0) return;

    const email = result[0].email;
    const deviceName = result[0].name;

    // fuzzy/action nanti bisa ditambahkan
    const action = "Pompa Tidak Diperlukan";
    
    const waterStatus = getWaterStatus(data.ph, data.suhu, data.tds, data.turbidity_status);

    const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    const html = `
      <h2>Laporan Monitoring Kolam</h2>

      <p><b>Device:</b> ${deviceName}</p>
      <p><b>Waktu:</b> ${waktu}</p>

      <hr>

      <p><b>pH:</b> ${data.ph}</p>
      <p><b>Suhu:</b> ${data.suhu}°C</p>
      <p><b>TDS:</b> ${data.tds}</p>
      <p><b>Turbidity:</b> ${data.turbidity_status}</p>

      <hr>

      <p><b>Status Air:</b> ${waterStatus}</p>
      <p><b>Tindakan Fuzzy:</b> ${action}</p>
    `;

    await sendEmail(
      `Monitoring Kolam - ${deviceName}`,
      html,
      email
    );
  }
  );
}
});