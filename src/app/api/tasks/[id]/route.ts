import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { title, completed, description, dueDate, priority } = await request.json();
  if (!title && typeof completed !== "boolean" && !description && !dueDate && !priority) {
    return NextResponse.json({ error: "At least one field is required" }, { status: 400 });
  }
  const data: any = {};
  if (title) data.title = title;
  if (typeof completed === "boolean") {
    data.completed = completed;
    data.completedAt = completed ? new Date() : null;
  }
  if (description !== undefined) data.description = description;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (priority !== undefined) data.priority = priority;
  const updated = await prisma.task.updateMany({
    where: { id: Number(params.id), userId: user.id },
    data,
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Task not found or not yours" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const deleted = await prisma.task.deleteMany({
    where: { id: Number(params.id), userId: user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Task not found or not yours" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 