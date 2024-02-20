import express from "express";
import bodyParser from "body-parser";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Document, Packer, Paragraph, TextRun } from 'docx'; // Added for docx support
const app = express();
const port = 3000;

puppeteer.use(StealthPlugin());

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files

app.get("/", (req, res) => {
  res.render("index", { title: "Web Scraper", data: null });
});

app.post("/scrape", async (req, res) => {
  const url = req.body.url;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

const data = await page.evaluate(() => {
  const metaTitle = document.querySelector("title")?.innerText;
  const metaDescription = document
    .querySelector('meta[name="description"]')
    ?.getAttribute("content");
  const keywords = document
    .querySelector('meta[name="keywords"]')
    ?.getAttribute("content");
  const pageText = document.body.innerText;
  const links = Array.from(document.querySelectorAll("a")).map((a) => ({
    href: a.href,
    text: a.innerText,
  }));
  const metaTags = Array.from(document.querySelectorAll("meta")).map(
    (meta) => ({
      name: meta.getAttribute("name"),
      content: meta.getAttribute("content"),
    })
  );
  const ctas = Array.from(
    document.querySelectorAll('button, input[type="submit"], a.cta, a.button')
  ).map((cta) => ({ text: cta.innerText, href: cta.href || null }));

  return {
    metaTitle,
    metaDescription,
    keywords,
    pageText,
    links,
    metaTags,
    ctas,
  };
});

  // Add the URL to the data object before sending it to the template
  data.url = url; // This line adds the URL to the data object

  await browser.close();
  lastScrapedData = data; // Store the scraped data, now including the URL
  res.render("index", { title: "Web Scraper", data });
});

let lastScrapedData = null; // This will hold the last scraped data

app.get("/download", async (req, res) => {
  if (!lastScrapedData) {
    return res.status(400).send('No data available to download.');
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun("Web Scraper Results"),
              new TextRun({
                text: "Meta Title: " + lastScrapedData.metaTitle,
                break: 1,
              }),
              new TextRun({
                text: "Meta Description: " + lastScrapedData.metaDescription,
                break: 1,
              }),
              new TextRun({
                text: "Keywords: " + lastScrapedData.keywords,
                break: 1,
              }),
              new TextRun({
                text: "Page Text: " + lastScrapedData.pageText,
                break: 1,
              }),
              // Add more TextRuns for other data points
            ],
          }),
          // Add a paragraph for links
          new Paragraph({
            children: lastScrapedData.links.map(link => 
              new TextRun({
                text: `${link.text}: ${link.href}`,
                break: 1,
              })
            ),
          }),
          // Add a paragraph for meta tags
          new Paragraph({
            children: lastScrapedData.metaTags.map(meta => 
              new TextRun({
                text: `${meta.name}: ${meta.content}`,
                break: 1,
              })
            ),
          }),
          // Add a paragraph for CTAs
          new Paragraph({
            children: lastScrapedData.ctas.map(cta => 
              new TextRun({
                text: `${cta.text}: ${cta.href}`,
                break: 1,
              })
            ),
          }),
          // ... Add more Paragraphs for other sections
        ],
      },
    ],
  });

  const b64string = await Packer.toBase64String(doc);

  res.setHeader('Content-Disposition', 'attachment; filename=ScrapedData.docx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.send(Buffer.from(b64string, 'base64'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
