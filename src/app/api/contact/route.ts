import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  try {
    const schema = z.object({
      name: z.string().trim().min(1).max(100),
      email: z.string().email().max(200),
      message: z.string().trim().min(1).max(5000),
    });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { name, email, message } = parsed.data;

    // Basic newline stripping in subject/body to reduce header injection risk
    const safeName = name.replace(/[\r\n]/g, " ");
    const safeEmail = email.replace(/[\r\n]/g, " ");
    const safeMessage = message;

    await resend.emails.send({
      from: "contact@chillfy.com",
      to: "info@chillfy.com",
      subject: `Contact Form from ${safeName}`,
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nMessage: ${safeMessage}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/contact failed", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}