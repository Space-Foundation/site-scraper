import express from "express";
import bodyParser from "body-parser";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const app = express();
const port = 3000;

puppeteer.use(StealthPlugin());

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

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
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content");
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute("content");
    const pageText = document.body.innerText;
    const links = Array.from(document.querySelectorAll('a')).map(a => a.href);

    return { metaTitle, metaDescription, keywords, pageText, links };
  });

  await browser.close();
  res.render("index", { title: "Web Scraper", data });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
