// API Route Handler for project creation

import { api } from "@/convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { gemini } from "@/lib/gemini";
import { generateUUID } from "@/lib/utils";
import { withAuth } from "@workos-inc/authkit-nextjs";

interface Attachment {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
}

export async function POST(request: Request) {
  const {
    content,
    attachments = [],
    isPublic,
    type: userType,
  } = (await request.json()) as {
    content: string;
    attachments?: Attachment[];
    isPublic: string;
    type?: "mobile" | "web";
  };
  const { user } = await withAuth();
  const isPublicBoolean = isPublic === "true";

  if (!user)
    return Response.json({ success: false, message: "User Not SignedIn" });
  console.log(content);
  const id = generateUUID();
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You're a UI/UX designer     
        Create a 5 words title for user request only
        
        - json response only 
        - no html or any markup  
        - no extra text or any other text
        - also as per user prompt you give a type you have 2 type : "web" |  "mobile" if user as for mobile app screen then it should be mobile else web 
        - if you didn't understand the user prompt and yo can't conclude that then you should return mobile as default
         
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
        
        { "title" : "Modern Appetizing Food Delivery App" , "type" : "mobile"}

        </AI response>
        
        </example> 


        ${content}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response || !response.text) return Response.json({ message: "Title Not Generated" });

    const res = response.text.trim();
    const parsed = JSON.parse(res);
    const title = parsed.title;
    const aiType = parsed.type; // "mobile" or "web" (was "desktop")

    // Normalize type (AI might return "desktop" based on old prompt)
    let finalType = userType;
    if (!finalType) {
      finalType = aiType === "desktop" ? "web" : aiType;
    }
    if (finalType !== "mobile" && finalType !== "web") {
      finalType = "mobile";
    }

    if (!title) return Response.json({ message: "Title Not Generated" });

    await convexClient.mutation(api.mutations.saveProject, {
      created_at: Date.now().toString(),
      user_id: user.id,
      project_id: id,
      title: title,
      type: finalType as "mobile" | "web",
      content: content,
      is_public: isPublicBoolean,
      attachments: attachments.map((a) => ({
        name: a.name,
        url: a.url,
        contentType: a.contentType,
        storageId: a.storageId as any,
      })),
    });

    return Response.json({ success: true, projectId: id });
  } catch (error) {
    console.error("Error creating project:", error);
    return Response.json(
      { success: false, message: "Title Not Generated" },
      { status: 500 },
    );
  }
}
