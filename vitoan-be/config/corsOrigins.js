function getAllowedOrigins() {
  const fromEnv = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const clientUrl = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [];
  return Array.from(new Set([...fromEnv, ...clientUrl]));
}

module.exports = { getAllowedOrigins };
