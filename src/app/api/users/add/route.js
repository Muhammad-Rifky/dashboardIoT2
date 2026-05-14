import db from "../../../lib/db";
import { getUser } from "../../../lib/auth";

export async function POST(req){

  const user = await getUser();

  if(user?.role !== "superadmin"){
    return Response.json({ error:"Forbidden" },{ status:403 });
  }

  const { name,email,password,role } = await req.json();

  await db.execute(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name,email,password,role]
  );

  return Response.json({ message:"User berhasil ditambahkan" });
}