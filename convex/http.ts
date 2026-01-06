import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

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
      // 1. Save user to database
      try {
        await ctx.runMutation(api.mutations.saveUser, {
          user_id: userData.id,
          email: userData.email,
          email_verified: userData.email_verified,
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_picture_url: userData.profile_picture_url,
          created_at: userData.created_at,
          password: null,
        });
        console.log(`User ${userData.email} saved to database`);
      } catch (error) {
        console.error("Error saving user to database:", error);
      }

      // 2. Create free subscription for new user
      try {
        const result = await ctx.runMutation(
          api.mutations.createFreeSubscription,
          {
            user_id: userData.id,
          }
        );
        console.log(
          `Free subscription created for ${userData.email}:`,
          result.status
        );
      } catch (error) {
        console.error("Error creating free subscription:", error);
      }

      // 2. Send welcome email
      try {
        // Get the base URL from environment or use a default
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
