import db from "../../../lib/db";
import { getUser } from "../../../lib/auth";

export async function GET(req){

  const user = await getUser();

  if(!user){
    return Response.json({ error:"Unauthorized" },{ status:401 });
  }

  const { searchParams } = new URL(req.url);
  const device_id = searchParams.get("device_id");

  let query = `
    SELECT d.device_id, s.ph, s.suhu, s.tds, s.turbidity, s.created_at
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.device_id
    WHERE 1=1
  `;

  let params = [];

  // 🔥 FILTER DEVICE
  if(device_id){
    query += " AND s.device_id = ?";
    params.push(device_id);
  }

  // 🔥 FILTER ROLE
  if(user.role !== "superadmin"){
    query += " AND d.user_id = ?";
    params.push(user.id);
  }

  query += `
    ORDER BY s.created_at DESC
  `;

  const [rows] = await db.execute(query, params);

  return Response.json(rows);
}