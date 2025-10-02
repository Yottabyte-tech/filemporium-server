import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint: /thingimage?url=<thingiverse_url>
app.get("/thingimage", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });
  if (!url.includes("thingiverse.com/thing:")) return res.status(400).json({ error: "URL must be from Thingiverse" });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch Thingiverse page");
    const html = await response.text();
    const $ = cheerio.load(html);

    const imageUrl = $('meta[property="og:image"]').attr("content");
    if (!imageUrl) return res.status(404).json({ error: "No image found on Thingiverse page" });

    res.json({ image: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: /thinginfo?url=<thingiverse_url>
app.get("/thinginfo", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });
  if (!url.includes("thingiverse.com/thing:")) return res.status(400).json({ error: "URL must be from Thingiverse" });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch Thingiverse page");
    const html = await response.text();
    const $ = cheerio.load(html);

    const image = $('meta[property="og:image"]').attr("content") || null;
    const title = $('meta[property="og:title"]').attr("content") || $('title').text() || null;
    const author = $('meta[name="author"]').attr("content") || null;

    if (!image && !title && !author) {
      return res.status(404).json({ error: "No usable information found on Thingiverse page" });
    }

    res.json({ image, title, author });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint
app.get("/", (req, res) => res.send("Thingiverse API running 🚀"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
