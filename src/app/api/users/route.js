// src/app/api/users/route.js
import db from "../../lib/db";
import { getUser } from "../../lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🔹 Ambil user yang login
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔹 Hanya superadmin yang bisa mengakses
    if (user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 🔹 Ambil semua user dari DB
    const [rows] = await db.execute(
      "SELECT id, name, email, role FROM users ORDER BY id DESC"
    );

    return NextResponse.json(rows);

  } catch (err) {
    console.error("API /users error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}