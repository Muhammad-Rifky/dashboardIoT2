require("dotenv").config();
const cron = require("node-cron");
const mysql = require("mysql2/promise");
const { sendEmail } = require("./email");

// =========================
// DB
// =========================
const db = mysql.createPool({
  host: "localhost",
  user: "iotuser",
  password: "123456",
  database: "iot_system",
});

// =========================
// CONFIG
// =========================
const OFFLINE_THRESHOLD = 10; // menit

console.log("🚀 Scheduler running...");

// =========================
// OFFLINE CHECK
// =========================
cron.schedule("* * * * *", async () => {

  console.log("🔍 Cek offline device...");

  try {

    const [devices] = await db.query(`
      SELECT 
        d.id,
        d.device_id,
        d.name,
        d.last_seen,
        d.is_notified_offline,
        u.email
      FROM devices d
      JOIN users u ON d.user_id = u.id
    `);

    const now = new Date();

    for (const d of devices) {

      if (!d.last_seen) continue;

      const lastSeen = new Date(d.last_seen);
      const diff = (now - lastSeen) / 1000 / 60;

      console.log(
        `${d.device_id} | ${diff.toFixed(1)} menit`
      );

      if (
        diff > OFFLINE_THRESHOLD &&
        d.is_notified_offline === 0
      ) {

        await sendEmail(
          "⚠️ Device Offline",
          `Device ${d.name} (${d.device_id}) offline lebih dari 10 menit.`,
          d.email
        );

        await db.query(`
          UPDATE devices
          SET is_notified_offline = 1
          WHERE id = ?
        `, [d.id]);

        console.log("🚨 OFFLINE:", d.device_id);
      }
    }

  } catch (err) {
    console.log("❌ Scheduler Error:", err.message);
  }

}, {
  timezone: "Asia/Jakarta"
});