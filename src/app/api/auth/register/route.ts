import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const start = Date.now();
  try {
    // Step 1: Parse request
    const parseStart = Date.now();
    const { name, email, password } = await req.json();
    const parseEnd = Date.now();
    console.log(`[Register] Parse request: ${parseEnd - parseStart}ms`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Step 2: Check existing user
    const checkStart = Date.now();
    const existing = await prisma.user.findUnique({ where: { email } });
    const checkEnd = Date.now();
    console.log(`[Register] Check existing user: ${checkEnd - checkStart}ms`);

    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }

    // Step 3: Hash password
    const hashStart = Date.now();
    const hashed = await bcrypt.hash(password, 10);
    const hashEnd = Date.now();
    console.log(`[Register] Hash password: ${hashEnd - hashStart}ms`);

    // Step 4: Create user
    const createStart = Date.now();
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });
    const createEnd = Date.now();
    console.log(`[Register] Create user: ${createEnd - createStart}ms`);

    const total = Date.now() - start;
    console.log(`[Register] Total time: ${total}ms`);

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
} 