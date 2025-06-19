// backend/index.js
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3001;

const express = require("express");
const bodyParser = require("body-parser");
// const chromium = require('chromium');

const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
    const browser = await puppeteer.launch({
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

    const page = await browser.newPage();
    await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle2" });

    await page.type('input[name="username"]', username, { delay: 100 });
    await page.type('input[name="password"]', password, { delay: 100 });
    await page.keyboard.press("Enter");

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await new Promise(r => setTimeout(r, 3000));

    await page.goto(postUrl, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 5000));

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
