const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// POST endpoint for waitlist
app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const filePath = path.join(__dirname, 'waitlist.json');
  let list = [];
  if (fs.existsSync(filePath)) {
    list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  if (list.some(item => item.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Already on waitlist' });
  }
  list.push({ email, ts: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
  res.json({ success: true });
});

// Serve static files (your site)
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});