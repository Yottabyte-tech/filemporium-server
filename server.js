import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/scrape", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    // Add headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };

    const response = await fetch(url, { headers, redirect: 'follow' });
    if (!response.ok) throw new Error("Failed to fetch page");

    const html = await response.text();
    const $ = cheerio.load(html);

    let data = { site: null, image: null, title: null, author: null };

    if (url.includes("thingiverse.com/thing:")) {
      data.site = "Thingiverse";
      data.image = $('meta[property="og:image"]').attr("content") || null;
      data.title = $('meta[property="og:title"]').attr("content") || $('title').text() || null;
      data.author = $('meta[name="author"]').attr("content") || null;
    } else if (url.includes("printables.com/")) {
      data.site = "Printables.com";
      data.image = $('meta[property="og:image"]').attr("content") || null;
      data.title = $('meta[property="og:title"]').attr("content") || $('title').text() || null;
      data.author = $('.creator-link').first().text().trim() || null;
    } else {
      return res.status(400).json({ error: "URL must be from Thingiverse or Printables.com" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("3D Print Scraper API is running 🚀"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
