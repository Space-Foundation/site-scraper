import express from "express";
import bodyParser from "body-parser";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'; // Added for docx support
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
    // Replace <br>, <p>, and <div> tags with line breaks before extracting text
    document.querySelectorAll('br').forEach(el => el.parentNode.replaceChild(document.createTextNode('\n'), el));
    document.querySelectorAll('p, div').forEach(el => el.appendChild(document.createTextNode('\n')));

    const metaTitle = document.querySelector("title")?.innerText;
    const metaDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    const keywords = document
      .querySelector('meta[name="keywords"]')
      ?.getAttribute("content");
    const pageText = document.body.innerText; // Now includes simple formatting
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

  data.url = url;
  await browser.close();
  lastScrapedData = data;
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
        properties: {},
        children: [
          new Paragraph({
            text: "Web Scraper Results",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: "Meta Title: " + lastScrapedData.metaTitle,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Meta Description: " + lastScrapedData.metaDescription,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: "Keywords: " + lastScrapedData.keywords,
            heading: HeadingLevel.HEADING_2,
          }),
          // Assuming pageText is parsed into paragraphs
          ...lastScrapedData.pageText.map(paragraph => new Paragraph({
            text: paragraph,
            spacing: {
              after: 200, // space after paragraph
            },
          })),
          // Example of adding a bulleted list for links
          new Paragraph({
            text: "Links:",
            heading: HeadingLevel.HEADING_2,
          }),
          ...lastScrapedData.links.map(link => new Paragraph({
            text: `${link.text}: ${link.href}`,
            bullet: {
              level: 0, // bullet level
            },
          })),
          // Further sections...
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
