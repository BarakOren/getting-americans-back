// backend/index.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { chromium } = require("playwright");
const app = express();
app.use(cors());
app.use(bodyParser.json());
import { americanNames } from "./americanNames.js"; // Import the list of common American names
// http://localhost:3001/api/scrape
// https://getting-americans-back-2.onrender.com/api/scrape


// List of common American names

app.post("/api/scrape", async (req, res) => {
  const { username, password, postUrl } = req.body;

  if (!username || !password || !postUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle" });

page.setDefaultTimeout(120000);           // wait up to 120s for selectors
page.setDefaultNavigationTimeout(120000); // wait up to 120s for navigation

    // Login
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.press('input[name="password"]', "Enter");
    await page.waitForLoadState("networkidle");

    // Go to post
    await page.goto(postUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(5000);

    // Extract usernames from comments
    const usernames = await page.$$eval('a[href^="/"][role="link"]', anchors =>
      [...new Set(anchors.map(a => a.textContent.trim()))].filter(u => u.length > 0)
    );

    const americanUsers = usernames.filter(username =>
      americanNames.some(name => username.toLowerCase().includes(name))
    );

    const profileLinks = americanUsers.map(u => `https://www.instagram.com/${u}/`);

    await browser.close();

    res.json({ usernames: americanUsers, links: profileLinks });
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: "Scraping failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
