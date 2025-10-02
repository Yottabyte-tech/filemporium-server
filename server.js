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
      files: [],
      site: null,
    };

    if (url.includes("thingiverse.com/thing:")) {
      data.site = "Thingiverse";
      data.image = $('meta[property="og:image"]').attr("content") || null;
      data.title = $('meta[property="og:title"]').attr("content") || $('title').text() || null;
      data.author = $('meta[name="author"]').attr("content") || null;
      // Thingiverse files
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/download/')) {
          const fullUrl = href.startsWith('http') ? href : `https://www.thingiverse.com${href}`;
          data.files.push(fullUrl);
        }
      });
    } else if (url.includes("printables.com/")) {
      data.site = "Printables.com";
      data.image = $('meta[property="og:image"]').attr("content") || null;
      data.title = $('meta[property="og:title"]').attr("content") || $('title').text() || null;
      data.author = $('.creator-link').first().text().trim() || null;
      // Printables files
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && (href.endsWith('.stl') || href.endsWith('.zip'))) {
          const fullUrl = href.startsWith('http') ? href : `https://printables.com${href}`;
          data.files.push(fullUrl);
        }
      });
    } else {
      return res.status(400).json({ error: "URL must be from Thingiverse or Printables.com" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint
app.get("/", (req, res) => res.send("3D Print Scraper API is running 🚀"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
