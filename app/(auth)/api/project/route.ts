"use server";

import { api } from "@/convex/_generated/api";
import { convexClient } from "@/lib/convex";
import openai from "@/lib/openai";
import { generateUUID } from "@/lib/utils";
import { withAuth } from "@workos-inc/authkit-nextjs";


export async function POST(request: Request) {
  const { content } = await request.json();
  const { user } = await withAuth();

  if (!user)
    return Response.json({ success: false, message: "User Not SignedIn" });
  console.log(content);
  const id = generateUUID();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "user",
          content: `
        You're a UI/UX designer     
        Create a 5 words title for user request only 
        
        - plain text repoonse only 
        - no html or any markup  
        - no extra text or any other text 
         
        <example> 
        
        <user Message>
         
        Create a modern food delivery mobile app with a clean, appetizing design. Include a top navigation bar with the app logo, location selector, and cart icon. Use a warm color scheme with orange/red accents.

            The home screen should have:
            - Search bar with filters
            - Category chips (Pizza, Burgers, Sushi, etc.)
            - Featured restaurant cards with images, ratings, and delivery time
            - Special offers banner
            - Bottom navigation bar with Home, Search, Orders, and Profile icons

            Use rounded corners, food photography, and clear typography. Add subtle shadows and a modern, hungry-inducing aesthetic.
                    
        </user Message>         
        
        <AI response> 
        
        Modern Appetizing Food Delivery App

        </AI response>
        
        </example> 


        ${content}`,
        },
      ],
    });

    const title = response.choices[0].message.content;
    if (!title) return Response.json({ message: "Title Not Generated" });

    await convexClient.mutation(api.mutations.saveProject, {
      created_at: Date.now().toString(),
      user_id: user.id,
      project_id: id,
      title: title,
      content: content,
    });

    return Response.json({ success: true, projectId: id });
  } catch (error) {
    console.error("Error creating project:", error);
    return Response.json(
      { success: false, message: "Title Not Generated" },
      { status: 500 }
    );
  }
}
