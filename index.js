// backend/index.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { chromium } = require("playwright");
const app = express();
app.use(cors());
app.use(bodyParser.json());

// List of common American names
const americanNames = [
  "john", "michael", "david", "james", "robert", "daniel", "brian",
  "jason", "kevin", "william", "ryan", "mark", "joseph", "thomas", "richard",
  "anthony", "steven", "charles", "matthew", "justin", "zach", "peter",
  "scott", "paul", "alex", "andrew", "brandon", "ben", "sam", "tom",
  "chris", "nick", "jesse", "tyler", "tim", "greg", "jeff", "kyle",
  "nathan", "sean", "eric", "ron", "jake"
];

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
