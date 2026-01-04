import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

interface User {
  id: string;
  data: {
    id: string;
    email: string;
    object: string;
    metadata: object;
    last_name: string;
    created_at: string;
    first_name: string;
    updated_at: string;
    external_id: string;
    email_verified: boolean;
    last_sign_in_at: string;
    profile_picture_url: string;
    password: string;
  };
  event: string;
  created_at: string;
}

http.route({
  path: "/workos-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const data: User = await request.json();
    const userData = data.data;

    // Only send welcome email for new user creation events
    if (data.event === "user.created") {
      try {
        // Get the base URL from environment or use a default
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://beta-niana.vercel.app/";

        // Call the Next.js API route to send welcome email
        const emailResponse = await fetch(`${baseUrl}/api/send-welcome-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
          }),
        });

        if (!emailResponse.ok) {
          console.error(
            "Failed to send welcome email:",
            await emailResponse.text()
          );
        } else {
          console.log(`Welcome email sent to ${userData.email}`);
        }
      } catch (error) {
        console.error("Error sending welcome email:", error);
      }
    }

    return new Response("success", {
      status: 200,
    });
  }),
});

export default http;
