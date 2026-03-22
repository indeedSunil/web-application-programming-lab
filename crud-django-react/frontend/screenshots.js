import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

  console.log("Navigating to frontend...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Type a Task and Add It
  try {
      await page.waitForSelector('input[placeholder="What needs to be done?"]', { timeout: 2000 });
      await page.type('input[placeholder="What needs to be done?"]', 'Review Pull Requests');
      await page.type('textarea', 'Review all frontend PRs before standup.');
      await page.select('select', 'high');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 1000)); // wait for task to be added

      await page.type('input[placeholder="What needs to be done?"]', 'Update README');
      await page.type('textarea', 'Add updated screenshots to docs folder.');
      await page.select('select', 'medium');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 1000));
  } catch (err) {
      console.log("Form not found or error adding tasks", err);
  }

  // 1. Overview
  await page.screenshot({ path: path.join(__dirname, '../docs/ss_1_overview.png') });
  
  // 2. Tasklist (hover a task to show edit/delete, wait for elements to exist)
  try {
      await page.waitForSelector('.task-card', { timeout: 2000 });
      await page.hover('.task-card:first-child');
      await page.screenshot({ path: path.join(__dirname, '../docs/ss_2_tasklist.png') });

      // 3. Edit mode
      await page.click('.btn-icon.success'); // the edit button
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(__dirname, '../docs/ss_3_edit.png') });

      // cancel edit
      await page.click('.btn-secondary'); // cancel button
      await new Promise(r => setTimeout(r, 300));
  } catch (err) {
      console.log("No tasks found to edit, skipping edit screenshot");
  }

  // 4. Completed
  const tabs = await page.$$('.filter-tab');
  if (tabs.length > 2) {
      await tabs[2].click();
      await new Promise(r => setTimeout(r, 800)); // wait for API
  }
  
  // Also check some task to show completion!
  try {
      const checkbox = await page.$('.task-checkbox');
      if (checkbox) {
          await checkbox.click();
          await new Promise(r => setTimeout(r, 1000)); // Wait for checkbox click toggle
      }
  } catch(e) {}

  await page.screenshot({ path: path.join(__dirname, '../docs/ss_4_completed.png') });

  // 5. API
  console.log("Navigating to api...");
  await page.goto('http://127.0.0.1:8000/api/tasks/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(__dirname, '../docs/ss_5_api.png') });

  await browser.close();
  console.log("Screenshots captured!");
})();
