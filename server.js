const serverless = require("serverless-http");
const app = require("./index");

if (process.env.VERCEL) {
  // Running on Vercel
  module.exports = serverless(app);
} else {
  // Running locally
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}
