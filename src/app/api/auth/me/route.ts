import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
