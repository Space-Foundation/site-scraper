# Project Documentation

## Overview
This project is a web scraper application built using Node.js and Express. It utilizes Puppeteer for scraping web pages and the [docx](file:///Users/CMcNeil/Sites/SiteScraper/server.js#5%2C55-5%2C55) library to generate and download a Word document containing the scraped data. The application has a simple web interface for inputting the URL to be scraped and displays the scraped data. It supports scraping meta titles, descriptions, keywords, page text, links, meta tags, and CTAs (Call to Action buttons).

## How to Run the Project

### Prerequisites
- Node.js installed on your system.
- Knowledge of using the terminal or command prompt.

### Steps to Run

1. **Clone the Repository**
   Clone the project to your local machine using Git.

2. **Install Dependencies**
   Navigate to the project directory in your terminal and run:
   ```bash
   npm install
   ```
   This command installs all the necessary packages listed in `package-lock.json`.

3. **Start the Server**
   Run the following command to start the server:
   ```bash
   npm start
   ```
   Or, if you have `nodemon` installed and prefer it for development:
   ```bash
   nodemon server.js
   ```

4. **Access the Web Interface**
   Open a web browser and go to `http://localhost:3000`. You should see the web interface of the scraper.

5. **Use the Application**
   - Enter the URL of the page you want to scrape in the input field.
   - Click the "Scrape" button.
   - The application will scrape the data and display it on the same page.
   - To download the scraped data as a Word document, click the "Download" button.

### Key Components

- **Server Setup**: The server is set up using Express and listens on port 3000. See the code snippet below for server initialization and starting.
  
```6:7:server.js
const app = express();
const port = 3000;
```

  
```140:142:server.js
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```


- **Web Scraping**: Puppeteer is used for web scraping. The `/scrape` endpoint handles the scraping logic.
  
```19:65:server.js
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
```


- **Generating and Downloading Word Document**: The `/download` endpoint generates a Word document with the scraped data using the `docx` library and sends it as a response for the user to download.
  
```69:138:server.js
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
```


### Notes
- Ensure that Puppeteer is compatible with your system. You might need additional setup on some operating systems.
- The application stores the last scraped data in memory. If the server restarts, this data will be lost.

This documentation provides a concise overview of running and understanding the web scraper project. For detailed exploration, refer to the codebase and comments within.