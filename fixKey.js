const fs = require("fs");

// Load your service account JSON
const raw = fs.readFileSync("firebase-admin-key.json", "utf8");
const json = JSON.parse(raw);

// Replace real newlines with \n
json.private_key = json.private_key.replace(/\n/g, "\\n");

// Save to a new file
fs.writeFileSync("serviceAccountKey.fixed.json", JSON.stringify(json, null, 2));

console.log("✅ Fixed key written to serviceAccountKey.fixed.json");
