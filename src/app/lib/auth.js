import { cookies } from "next/headers";
import db from "./db";

export async function getUser(){

  // 🔥 WAJIB pakai await
  const cookieStore = await cookies();

  const session = cookieStore.get("session");

  if(!session){
    return null;
  }

  const [rows] = await db.execute(
    "SELECT id, name, role FROM users WHERE id=?",
    [session.value]
  );

  if(rows.length === 0){
    return null;
  }

  return rows[0];
}