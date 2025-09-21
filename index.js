// index.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const app = express();
app.use(express.urlencoded({ extended: false }));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// WhatsApp webhook
app.post("/api/whatsapp_webhook", async (req, res) => {
  const from = req.body.From; // User WhatsApp number
  const body = req.body.Body; // Message text

  // Find or create user in Supabase
  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("phone_number", from)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from("users")
      .insert([{ phone_number: from }])
      .select()
      .single();
    user = newUser;
  }

  // Save user message
  await supabase
    .from("user_chats")
    .insert([{ user_id: user.id, message: body, sender: "user" }]);

  // Simple bot reply (replace with AI later)
  const reply = `Hello! You said: ${body}`;

  // Save bot reply
  await supabase
    .from("user_chats")
    .insert([{ user_id: user.id, message: reply, sender: "bot" }]);

  // Send reply to WhatsApp via Twilio
  await twilioClient.messages.create({
    from: "whatsapp:+14155238886", // Twilio Sandbox number
    to: from,
    body: reply
  });

  res.send("OK");
});

// Start server (Vercel handles this automatically)
export default app;
