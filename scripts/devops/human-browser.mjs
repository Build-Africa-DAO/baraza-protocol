import puppeteer from 'puppeteer-core';
import { resolve } from 'node:path';

const ARTIFACTS_DIR = '/home/nothim/.gemini/antigravity-ide/brain/1e34b75b-af2f-4243-b9f0-4769e821e665/screenshots';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runHumanBrowser() {
  console.log('🚀 Launching real Google Chrome binary (/usr/bin/google-chrome)...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await browser.newPage();

  console.log('🌐 Step 1: Navigating to https://barazaprotocol.com/create...');
  await page.goto('https://barazaprotocol.com/create', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  const step1Path = resolve(ARTIFACTS_DIR, '01_initial_create_page.png');
  await page.screenshot({ path: step1Path, fullPage: false });
  console.log('📸 Step 1 Screenshot saved:', step1Path);

  // Step 2: Click "Create Account"
  console.log('🔍 Step 2: Locating "Create Account" button...');
  const buttons = await page.$$('button');
  let createAccountBtn = null;
  for (const b of buttons) {
    const text = await b.evaluate(el => el.textContent);
    if (text && text.trim() === 'Create Account') {
      createAccountBtn = b;
      break;
    }
  }

  if (!createAccountBtn) {
    console.error('❌ Could not find "Create Account" button!');
    await browser.close();
    return;
  }

  console.log('🖱️ Step 2: Hovering and clicking "Create Account"...');
  await createAccountBtn.hover();
  await sleep(400);
  await createAccountBtn.click();

  // Wait for the modal dialog to mount after the Privy chunk finishes downloading
  console.log('⏳ Waiting for Auth Modal dialog to appear...');
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await sleep(600);

  const step2Path = resolve(ARTIFACTS_DIR, '02_modal_opened.png');
  await page.screenshot({ path: step2Path, fullPage: false });
  console.log('📸 Step 2 (Modal Opened) Screenshot saved:', step2Path);

  // Step 3: Test tab switching (Phone tab)
  console.log('📱 Step 3: Locating and testing Phone tab...');
  const modalButtons = await page.$$('[role="dialog"] button');
  let phoneTab = null;
  let emailTab = null;
  let googleBtn = null;

  for (const b of modalButtons) {
    const text = await b.evaluate(el => el.textContent);
    if (text && text.includes('Phone')) phoneTab = b;
    if (text && text.includes('Email')) emailTab = b;
    if (text && text.includes('Continue with Google')) googleBtn = b;
  }

  if (phoneTab) {
    await phoneTab.click();
    await sleep(600);
    const step3Path = resolve(ARTIFACTS_DIR, '03_phone_tab_active.png');
    await page.screenshot({ path: step3Path, fullPage: false });
    console.log('📸 Step 3 (Phone Tab) Screenshot saved:', step3Path);
  }

  if (emailTab) {
    await emailTab.click();
    await sleep(500);
  }

  // Step 4: Human typing test in email input
  console.log('⌨️ Step 4: Human typing test in email input...');
  const emailInput = await page.$('[role="dialog"] input[type="email"]');
  if (emailInput) {
    await emailInput.click();
    const testEmail = 'tester@barazaprotocol.com';
    for (const char of testEmail) {
      await page.keyboard.type(char);
      await sleep(35 + Math.random() * 45);
    }
    await sleep(600);
    const step4Path = resolve(ARTIFACTS_DIR, '04_email_typed.png');
    await page.screenshot({ path: step4Path, fullPage: false });
    console.log('📸 Step 4 (Email Typed) Screenshot saved:', step4Path);

    // Clear input
    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await sleep(400);
  }

  // Step 5: Test "Continue with Google" button
  if (googleBtn) {
    console.log('🖱️ Step 5: Hovering over "Continue with Google"...');
    await googleBtn.hover();
    await sleep(500);

    console.log('🖱️ Step 5: Clicking "Continue with Google"...');
    await googleBtn.click();

    // Catch the instant "Connecting to Google…" state
    await sleep(180);
    const step5Path = resolve(ARTIFACTS_DIR, '05_connecting_to_google_feedback.png');
    await page.screenshot({ path: step5Path, fullPage: false });
    console.log('📸 Step 5 (Connecting to Google) Screenshot saved:', step5Path);

    // Wait for navigation to accounts.google.com
    console.log('⏳ Waiting for navigation to accounts.google.com...');
    try {
      await page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' });
      const currentUrl = page.url();
      console.log('🌐 Landed on external URL:', currentUrl);

      await sleep(1000);
      const step6Path = resolve(ARTIFACTS_DIR, '06_accounts_google_com.png');
      await page.screenshot({ path: step6Path, fullPage: false });
      console.log('📸 Step 6 (Google Accounts screen) Screenshot saved:', step6Path);
    } catch (e) {
      console.log('Navigation wait timed out or handled. Current URL:', page.url());
      const fallbackPath = resolve(ARTIFACTS_DIR, '06_after_google_click.png');
      await page.screenshot({ path: fallbackPath, fullPage: false });
      console.log('📸 Screenshot saved at fallback:', fallbackPath);
    }
  }

  console.log('\n🎉 Real human browser test complete!');
  await browser.close();
}

runHumanBrowser().catch(err => {
  console.error('Fatal browser test error:', err);
  process.exit(1);
});
