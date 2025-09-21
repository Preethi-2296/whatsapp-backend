export default function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  res.status(200).json({ supabaseUrl: url || "Not set!" });
}
