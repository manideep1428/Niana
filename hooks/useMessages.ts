import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function useMessages({ id }: { id: Id<"projects"> }) {
  const [messages, setMessages] = useState<any>([]);
  const messagesData = useQuery(api.quires.getMessages, { id: id });
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
    console.log(messagesData);
  }, [messagesData]);
  return messages;
}
