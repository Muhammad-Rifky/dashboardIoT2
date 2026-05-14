import db from "../../../../lib/db";

export async function GET(req, { params }) {
  const { id } = params;

  const [rows] = await db.query(`
    SELECT * FROM sensor_data
    WHERE device_id = ?
    ORDER BY created_at ASC
  `, [id]);

  return Response.json(rows);
}