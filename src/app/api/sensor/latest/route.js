import db from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT * FROM sensor_data
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      return Response.json({ message: "Belum ada data" });
    }

    return Response.json(rows[0]);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}