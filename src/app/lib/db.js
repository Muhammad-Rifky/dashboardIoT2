import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "76.13.192.195",
  user: "iotuser",
  password: "123456",
  database: "iot_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;