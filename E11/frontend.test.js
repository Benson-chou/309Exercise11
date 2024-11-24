const puppeteer = require("puppeteer");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

describe("Canada holidays app", () => {
  let browser;
  let page;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function type(selector, text) {
    for (let i = 0; i < text.length; i++) {
      page.type(selector, text[i]);
      await sleep(50);
    }
  }

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  afterAll(async () => {
    try {
      await browser.close();
    } catch (error) {
      console.log(
        "Failed to close browser. Browser may stay open or have already closed."
      );
    }
  });

  const elementExists = async (selector) => {
    const element = await page.$(selector);
    return element !== null;
  };

  const getTableHeaders = async () => {
    return page.$$eval("#holidays-table th", (headers) =>
      headers.map((header) => header.textContent.trim())
    );
  };

  const getTableRows = async () => {
    return page.$$eval("#holidays-table tbody tr", (rows) => rows.length);
  };

  const waitForTableRows = async () => {
    await page.waitForFunction(
      () => document.querySelectorAll("#holidays-table tbody tr").length > 0,
      { timeout: 2000 }
    );
  };

  const getFirstRowData = async () => {
    return page.$$eval("#holidays-table tbody tr:first-child td", (cells) =>
      cells.map((cell) => cell.textContent.trim())
    );
  };

  describe("UI elements", () => {
    it("Year filter dropdown should exist", async () => {
      const exists = await elementExists("#year-filter");
      expect(exists).toBe(true);
    });

    it("Province filter dropdown should exist", async () => {
      const exists = await elementExists("#province-filter");
      expect(exists).toBe(true);
    });

    it("Search bar should exist", async () => {
      const exists = await elementExists("#holiday-search");
      expect(exists).toBe(true);
    });

    it("Holidays table should exist", async () => {
      const exists = await elementExists("#holidays-table");
      expect(exists).toBe(true);
    });
  });

  describe("Holidays table", () => {
    it("Holidays table should have correct headers", async () => {
      const headers = await getTableHeaders();
      const expectedHeaders = ["Date", "Name", "Name (FR)", "Province(s)"];
      expect(headers).toEqual(expectedHeaders);
    });

    it("Holidays table should show results", async () => {
      await waitForTableRows(); // Wait until the table rows are populated
      const rowCount = await getTableRows();
      expect(rowCount).toBeGreaterThan(0);

      // Check the contents of the first row
      const firstRowData = await getFirstRowData();
      expect(firstRowData.length).toBe(4);

      const [date, name, province] = firstRowData;

      // Validate the contents
      expect(date).toMatch(/\d{4}-\d{2}-\d{2}/); // Date should be in YYYY-MM-DD format
      expect(name.length).toBeGreaterThan(0); // Holiday name should not be empty
      expect(province.length).toBeGreaterThan(0); // Province should not be empty
    });
  });

  describe("Search and pagination", () => {
    it("Table content should match search query", async () => {
      await type("#holiday-search", "New Year");
      await sleep(500);

      await waitForTableRows();

      const firstRowName = await page.$eval(
        "#holidays-table tbody tr:first-child td:nth-child(2)",
        (cell) => cell.textContent.trim()
      );
      expect(firstRowName).toContain("New Year");
    });

    it("Pagination should work correctly", async () => {
      // Clear the current search
      await page.click("#holiday-search");
      for (i = 0; i < 10; i++) {
        await page.keyboard.press("Backspace");
      }

      await waitForTableRows(); // Wait until the table rows are populated
      const rowCount = await getTableRows();
      expect(rowCount).toBe(10);

      await page.click("#next-page");
      await waitForTableRows(); // Ensure the new page's data is loaded
      const newPageData = await getFirstRowData();
      await page.click("#prev-page");
      await waitForTableRows(); // Ensure the original page's data is loaded
      const originalPageData = await getFirstRowData();

      expect(newPageData.toString()).not.toEqual(originalPageData.toString());
    });
  });

  describe("Query persistence", () => {
    it("Filters and search should persist after refresh", async () => {
      await page.select("#year-filter", "2023");
      await page.select("#province-filter", "ON");
      await type("#holiday-search", "New Year");
      await sleep(500);

      await page.reload({ waitUntil: "domcontentloaded" });

      await sleep(500);

      const year = await page.$eval("#year-filter", (el) => el.value);
      const province = await page.$eval("#province-filter", (el) => el.value);
      const search = await page.$eval("#holiday-search", (el) => el.value);

      expect(year).toBe("2023");
      expect(province).toBe("ON");
      expect(search).toBe("New Year");
    });
  });
});