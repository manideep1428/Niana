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
    metadata: {};
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
    const dbData = data.data;
    await ctx.runMutation(api.mutations.saveUser, {
      user_id: dbData.id,
      email: dbData.email,
      email_verified: dbData.email_verified,
      first_name: dbData.first_name,
      last_name: dbData.last_name,
      created_at: dbData.created_at,
      profile_picture_url: dbData.profile_picture_url,
      password: dbData.password || "",
    });
    return new Response("success", {
      status: 200,
    });
  }),
});

export default http;
