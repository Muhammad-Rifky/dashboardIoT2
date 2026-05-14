import { NextResponse } from "next/server";

export async function POST() {

  const res = NextResponse.json({ message: "Logout berhasil" });

  res.cookies.set("session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return res;
}