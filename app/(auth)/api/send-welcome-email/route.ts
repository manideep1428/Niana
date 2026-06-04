import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

let resend: Resend | null = null;
function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "dummy_key_for_build");
  }
  return resend;
}

// Email template function
function getWelcomeEmailTemplate(firstName: string): string {
  return ` <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Niana</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #111827;
    }
    
    .container {
      max-width: 560px;
      width: 100%;
    }
    
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    
    .brand {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 48px;
    }
    
    h1 {
      font-size: 40px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .intro {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 48px;
      line-height: 1.6;
    }
    
    .button {
      display: inline-block;
      background: #111827;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 15px;
      transition: all 0.2s;
    }
    
    .button:hover {
      background: #1f2937;
      transform: translateY(-1px);
    }
    
    .footer {
      margin-top: 80px;
      padding-top: 32px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-text {
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.8;
    }
    
    .footer-link {
      color: #111827;
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 600px) {
      h1 {
        font-size: 32px;
      }
      
      .intro {
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Niana</div>
    
    <h1>Welcome to Niana</h1>
    
    <p class="intro">
      We're excited to have you here. Niana is an AI-powered design studio that transforms your ideas into production-ready designs. No design experience required—just bring your creativity.
    </p>
    
    <a href="https://discord.gg/vP8jBBCy" class="button" style="margin-right: 12px;">
      Join community
    </a>
    
    <a href="https://cal.com/manideep-zgprs5/15min" class="button" style="background: #ffffff; color: #111827; border: 1px solid #e5e7eb;">
      Schedule a meeting
    </a>
    
    <div class="footer">
      <p class="footer-text">
        Made by Vicky<br>
        Questions? <a href="mailto:vicky@niana.design" class="footer-link">Get in touch</a>
      </p>
    </div>
  </div>
</body>
</html> `;
}

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate the email template
    const htmlContent = getWelcomeEmailTemplate(firstName);

    // Send the welcome email
    try {
      const { data, error } = await getResendClient().emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Niana <vicky@niana.design>",
        to: [email],
        subject: "🎉 Welcome to Niana - Your AI Design Journey Begins!",
        html: htmlContent,
      });

      if (error) {
        console.error("Failed to send welcome email:", error);
        return NextResponse.json(
          { error: "Failed to send email", details: error },
          { status: 500 },
        );
      }

      console.log(`Welcome email sent to ${email}`, data);

      return NextResponse.json(
        { success: true, message: "Welcome email sent successfully", data },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error sending welcome email with Resend:", error);
      return NextResponse.json(
        {
          error: "Failed to send welcome email",
          details: String(error),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error processing welcome email request:", error);
    return NextResponse.json(
      {
        error: "Failed to process welcome email request",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
