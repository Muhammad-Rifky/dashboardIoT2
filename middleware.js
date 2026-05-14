import { NextResponse } from "next/server";

export function middleware(req){

  const session = req.cookies.get("session");

  if(!session){

    return NextResponse.redirect(new URL("/login",req.url));

  }

  return NextResponse.next();

  if(user.role === "petani"){
  query += " AND device_id IN (SELECT device_id FROM devices WHERE user_id = ?)";
  params.push(user.id);
}

}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/devices",
    "/devices/:path*",
    "/users",
    "/users/:path*",
    "/history",
    "/history/:path*"
  ]
};