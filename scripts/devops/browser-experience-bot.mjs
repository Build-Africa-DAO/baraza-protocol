#!/usr/bin/env node
// scripts/devops/browser-experience-bot.mjs
// Automated Visual UX & Interaction Testing Bot for Baraza Protocol

import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SCREENSHOTS_DIR = '/home/nothim/.gemini/antigravity-ide/brain/1e34b75b-af2f-4243-b9f0-4769e821e665/screenshots';
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:5173';

const results = [];

async function run() {
  console.log('='.repeat(80));
  console.log('   BARAZA PROTOCOL — AUTOMATED UX & VISUAL INTERACTION AUDIT BOT');
  console.log('   Standard: S&P 500 Enterprise Visual QA & Interaction Verification');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  async function testPage(name, path, options = {}) {
    console.log(`\n▶ [AUDIT] Testing: ${name} (${path})...`);
    const fullUrl = `${BASE_URL}${path}`;
    const start = Date.now();

    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1200)); // allow CSS animations to settle

      if (options.actions) {
        await options.actions(page);
        await new Promise(r => setTimeout(r, 600));
      }

      const desktopFile = resolve(SCREENSHOTS_DIR, `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_desktop.png`);
      await page.screenshot({ path: desktopFile, fullPage: options.fullPage ?? false });
      console.log(`  📸 Desktop Screenshot: ${desktopFile}`);

      // Mobile check if requested
      if (options.mobile) {
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
        await new Promise(r => setTimeout(r, 600));
        const mobileFile = resolve(SCREENSHOTS_DIR, `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_mobile.png`);
        await page.screenshot({ path: mobileFile, fullPage: options.fullPage ?? false });
        console.log(`  📱 Mobile Screenshot: ${mobileFile}`);
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
      }

      const duration = Date.now() - start;
      const title = await page.title();
      results.push({ name, path, status: 'PASS', duration, title, error: null });
      console.log(`  ✅ ${name} passed in ${duration}ms (Title: "${title}")`);
    } catch (err) {
      console.error(`  ❌ ${name} failed: ${err.message}`);
      results.push({ name, path, status: 'FAIL', duration: Date.now() - start, error: err.message });
    }
  }

  // 1. Landing Page
  await testPage('01_Landing_Page', '/', {
    fullPage: false,
    mobile: true,
    actions: async p => {
      await p.evaluate(() => window.scrollBy(0, 400));
      await new Promise(r => setTimeout(r, 300));
      await p.evaluate(() => window.scrollBy(0, -400));
    },
  });

  // 2. Communities Explorer
  await testPage('02_Communities_Explorer', '/groups', {
    fullPage: false,
    mobile: true,
  });

  // 3. Create Community Flow
  await testPage('03_Create_Community', '/create', {
    fullPage: true,
  });

  // 4. Join DAO Flow - Canva Creators Kenya (Pilot Exempt)
  await testPage('04_Join_DAO_Pilot', '/join/canva-creators-ke', {
    fullPage: true,
    mobile: true,
  });

  // 5. Pay Dues - Canva Creators Kenya (Pilot Time-gated)
  await testPage('05_Pay_Dues_Pilot_Gated', '/dashboard/canva-creators-ke/pay', {
    fullPage: true,
    mobile: true,
    actions: async p => {
      const pageText = await p.evaluate(() => document.body.innerText);
      const isGated = pageText.includes('October 10') || pageText.includes('Pilot Window') || pageText.includes('free');
      console.log(`  🔍 Pilot Gating Verification: isGated=${isGated}`);
    },
  });

  // 6. Join DAO - Standard Community (Milele with 1.5% fee badge & KES 250 fee)
  await testPage('06_Join_DAO_Standard', '/join/051fbe9b-ea74-4467-aaee-03d94de858d0', {
    fullPage: true,
    mobile: true,
  });

  // 7. Pay Dues - Standard Community (Milele 5-line Itemized Breakdown)
  await testPage('07_Pay_Dues_Itemized_Checkout', '/dashboard/051fbe9b-ea74-4467-aaee-03d94de858d0/pay', {
    fullPage: true,
    mobile: true,
    actions: async p => {
      const pageText = await p.evaluate(() => document.body.innerText);
      const hasFee15 = pageText.includes('1.5%') || pageText.includes('1.5');
      const hasBreakdown = pageText.includes('Daraja') || pageText.includes('Platform Fee') || pageText.includes('Carrier');
      console.log(`  🔍 Standard Itemized Verification: has1.5%=${hasFee15}, hasBreakdown=${hasBreakdown}`);
    },
  });

  // 8. Protocol Status Dashboard
  await testPage('08_Status_Dashboard', '/status', {
    fullPage: false,
  });

  // 9. Interactive UI Component Library
  await testPage('09_Dev_UI_System', '/dev/ui', {
    fullPage: false,
  });

  await browser.close();

  console.log('\n' + '='.repeat(80));
  console.log('   UX BOT AUDIT EXECUTION SUMMARY');
  console.log('='.repeat(80));
  console.table(results);

  if (consoleErrors.length > 0) {
    console.log(`\n⚠️ Browser Console Warnings/Errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach(e => console.log(' - ', e));
  } else {
    console.log('\n✨ Zero unhandled browser exceptions during walkthrough!');
  }
}

run().catch(err => {
  console.error('Bot execution failed:', err);
  process.exit(1);
});
