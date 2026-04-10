// api/devices/assign/route.js
import db from "../../../lib/db";
import { getUser } from "../../../lib/auth";

export async function PUT(req) {
  const user = await getUser();

  if (!user || user.role !== "superadmin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { device_id, user_id } = await req.json();

  await db.execute(
    `UPDATE devices SET user_id=? WHERE device_id=?`,
    [user_id, device_id]
  );

  return Response.json({ message: "Device berhasil diassign ulang" });
}