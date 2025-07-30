import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: token.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { name, email, image } = await request.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });
    return NextResponse.json({ name: updated.name, email: updated.email, image: updated.image });
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Failed to update profile", details: e?.message || e?.toString() }, { status: 500 });
  }
} 