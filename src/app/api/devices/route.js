import db from "../../lib/db";
import { getUser } from "../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(){

  const user = await getUser();

  if(!user){
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let query = `
    SELECT 
      d.id,
      d.device_id,
      d.name,
      d.location,
      d.user_id,
      d.last_seen
    FROM devices d
    WHERE 1=1
  `;

  let params = [];

  if(user.role !== "superadmin"){
    query += " AND d.user_id = ?";
    params.push(user.id);
  }

  query += `
    ORDER BY d.id DESC
  `;

  const [rows] = await db.execute(query, params);

  const devices = rows.map(d => {

    let status = "offline";

    if(d.last_seen){
      const diff = (Date.now() - new Date(d.last_seen)) / 1000;

      if(diff < 600){
        status = "online";
      }
    }

    return {
      ...d,
      status
    };
  });

  return Response.json(devices);
}