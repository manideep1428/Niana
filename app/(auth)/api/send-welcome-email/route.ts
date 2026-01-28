import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template function
function getWelcomeEmailTemplate(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Niana</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Poppins', sans-serif;
      background: #0f0f1e;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      width: 100%;
      max-width: 700px;
      background: #1a1a2e;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      border: 1px solid rgba(236, 72, 153, 0.1);
    }
    
    .header {
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      padding: 80px 40px;
      text-align: center;
      position: relative;
    }
    
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 32px;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(236, 72, 153, 0.3), 0 0 40px rgba(168, 85, 247, 0.2);
    }
    
    .brand-name {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(to right, #ec4899, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    
    .tagline {
      color: #9ca3af;
      font-size: 14px;
      font-weight: 400;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .content {
      padding: 50px 40px;
    }
    
    .welcome-heading {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    
    .creator-text {
      background: linear-gradient(to right, #ec4899, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }
    
    .welcome-text {
      color: #d1d5db;
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 40px;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .feature-card {
      padding: 24px;
      background: rgba(236, 72, 153, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(236, 72, 153, 0.15);
    }
    
    .feature-title {
      font-size: 14px;
      font-weight: 700;
      background: linear-gradient(to right, #ec4899, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    
    .feature-description {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.5;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.2), transparent);
      margin: 40px 0;
    }
    
    .cta-section {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .cta-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
    }
    
    .cta-subtitle {
      color: #9ca3af;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(to right, #ec4899, #a855f7, #ec4899);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
      border: none;
      cursor: pointer;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(236, 72, 153, 0.4);
    }
    
    .footer {
      background: rgba(0, 0, 0, 0.2);
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid rgba(236, 72, 153, 0.1);
    }
    
    .footer-text {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.8;
    }
    
    .footer-link {
      background: linear-gradient(to right, #ec4899, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
      font-weight: 600;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 600px) {
      .header {
        padding: 50px 24px;
      }
      
      .content {
        padding: 35px 24px;
      }
      
      .brand-name {
        font-size: 28px;
      }
      
      .welcome-heading {
        font-size: 26px;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://i.ibb.co/39yXf0hx/logo.png" alt="Niana Logo" class="logo">
      <h1 class="brand-name">NIANA</h1>
      <p class="tagline">AI-Powered Design Studio</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <h2 class="welcome-heading">Welcome to Niana</h2>
      
      <p class="creator-text">
        I'm Vicky, creator of Niana
      </p>
      
      <p class="welcome-text">
        We're excited to have you join us. Niana transforms your ideas into beautiful, production-ready designs using AI technology. No design experience required—just your creativity.
      </p>
      
      <!-- Features -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-title">Fast</div>
          <div class="feature-description">Generate designs in seconds</div>
        </div>
        <div class="feature-card">
          <div class="feature-title">Intelligent</div>
          <div class="feature-description">Smart suggestions for your vision</div>
        </div>
        <div class="feature-card">
          <div class="feature-title">Production Ready</div>
          <div class="feature-description">Export code to use immediately</div>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <!-- CTA Section -->
      <div class="cta-section">
        <h3 class="cta-title">Let's Connect</h3>
        <p class="cta-subtitle">
          Want to learn more about how Niana can improve your workflow? Schedule a call with our team.
        </p>
        <a href="https://cal.com/manideep-zgprs5/15min" class="cta-button">
          Schedule a Meeting
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        Made by the Niana Team<br><br>
        Questions? <a href="mailto:support@niana.com" class="footer-link">Get in touch</a> — we'd love to hear from you<br><br>
        © 2026 Niana. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
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
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Niana <onboarding@resend.dev>",
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
