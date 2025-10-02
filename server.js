import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Unified endpoint: /scrape?url=<thingiverse_or_printables_url>
 */
app.get("/scrape", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch page");
    const html = await response.text();
    const $ = cheerio.load(html);

    let data = {
      image: null,
      title: null,
      author: null,
      site: null,
    };

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

const server = app.listen(PORT, () => console.log(`Server running on ${PORT}`));
server.maxHeadersCount = 5000; // 5000 headers
