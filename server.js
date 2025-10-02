import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors"; // <-- import cors

const app = express();
const PORT = process.env.PORT || 3000;

// Allow JSON input
app.use(express.json());

// Enable CORS for all origins (so your frontend can call it)
app.use(cors());

// Endpoint: /thingimage?url=<thingiverse_url>
app.get("/thingimage", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  // Only allow Thingiverse links
  if (!url.includes("thingiverse.com/thing:")) {
    return res.status(400).json({ error: "URL must be from Thingiverse" });
  }

  try {
    // Fetch the page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch Thingiverse page");
    }
    const html = await response.text();

    // Parse with Cheerio
    const $ = cheerio.load(html);

    // Find the OG:image meta tag (Thingiverse sets preview image here)
    const imageUrl = $('meta[property="og:image"]').attr("content");

    if (!imageUrl) {
      return res.status(404).json({ error: "No image found on Thingiverse page" });
    }

    res.json({ image: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: /downloads?url=<thingiverse_url>
// Endpoint: /thinginfo?url=<thingiverse_url>
app.get("/thinginfo", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  if (!url.includes("thingiverse.com/thing:")) {
    return res.status(400).json({ error: "URL must be from Thingiverse" });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch Thingiverse page");
    const html = await response.text();
    const $ = cheerio.load(html);

    // Get OG image
    const image = $('meta[property="og:image"]').attr("content") || null;

    // Get title
    const title = $('meta[property="og:title"]').attr("content") || $('title').text() || null;

    // Get author
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
app.get("/", (req, res) => {
  res.send("Thingiverse Image API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
