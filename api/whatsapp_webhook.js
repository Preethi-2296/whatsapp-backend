const { createClient } = require("@supabase/supabase-js");
const twilio = require("twilio");
const { buffer } = require("micro");

module.exports.config = { api: { bodyParser: false } };

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const buf = await buffer(req);
  const params = new URLSearchParams(buf.toString());
  const from = params.get("From");
  const body = params.get("Body");

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

  // Bot reply
  const reply = `Hello! You said: ${body}`;
  await supabase
    .from("user_chats")
    .insert([{ user_id: user.id, message: reply, sender: "bot" }]);

  // Send reply via Twilio WhatsApp
  await twilioClient.messages.create({
    from: "whatsapp:+14155238886", // Twilio Sandbox number
    to: from,
    body: reply
  });

  res.status(200).send("OK");
};
