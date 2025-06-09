const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
app.use(express.json());

app.get('/account-inquiry', async (req, res) => {
  const { account_number, account_bank } = req.query;

  if (!account_number || !account_bank) {
    return res.status(400).json({ error: 'Missing account_number or account_bank' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath || '/usr/bin/chromium-browser',
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    await page.goto('https://belibayar.online', { waitUntil: 'networkidle2' });

    const response = await page.evaluate(async (account_number, account_bank) => {
      const res = await fetch('https://cekrekening-api.belibayar.online/api/v1/account-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ account_number, account_bank }),
      });
      return await res.json();
    }, account_number, account_bank);

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
