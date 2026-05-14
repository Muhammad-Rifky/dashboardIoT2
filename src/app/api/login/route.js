import db from "../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req){

  const { email, password } = await req.json();

  const [rows] = await db.execute(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email,password]
  );

  if(rows.length === 0){
    return NextResponse.json(
      { error:"Email atau password salah" },
      { status:401 }
    );
  }

  const user = rows[0];

  const res = NextResponse.json({
    message:"Login berhasil"
  });

  res.cookies.set("session", user.id, {
    httpOnly: true,
    path: "/"
  });

  return res;
}