import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();
  const resend = new Resend(process.env.RESEND_API_KEY!);

  try {
    await resend.emails.send({
      from: "contact@chillfy.com",
      to: "info@chillfy.com",
      subject: `Contact Form from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}