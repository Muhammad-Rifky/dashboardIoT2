import db from "../../lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {

  try {
    // 🔹 cookies() itu async, harus await
    const cookieStore = await cookies(); 
    const session = cookieStore.get("session"); // sekarang sudah bisa get

    if(!session || !session.value){
      return NextResponse.json(
        { error:"Unauthorized" },
        { status:401 }
      );
    }

    // Query user berdasarkan session
    const [rows] = await db.execute(
      "SELECT id, name, role FROM users WHERE id=?",
      [session.value]
    );

    if(rows.length === 0){
      return NextResponse.json(
        { error:"User tidak ditemukan" },
        { status:404 }
      );
    }

    return NextResponse.json(rows[0]);

  } catch (err) {
    console.error("API /me error:", err);
    return NextResponse.json(
      { error:"Server error" },
      { status:500 }
    );
  }
}