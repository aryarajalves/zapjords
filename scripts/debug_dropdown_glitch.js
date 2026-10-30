const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  await context.addInitScript(() => {
    localStorage.setItem('activeClientId', '14');
  });

  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    await page.evaluate(() => {
      localStorage.setItem('activeClientId', '14');
    });

    const chatNavBtn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first();
    if (await chatNavBtn.isVisible()) {
      await chatNavBtn.click();
      await page.waitForTimeout(4000);
    }

    const selectAllBtn = page.locator('button:has-text("Selecionar todas")').first();
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      await page.waitForTimeout(1500);
    }

    const bulkTemplateBtn = page.locator('#bulk-template-btn');
    await bulkTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await bulkTemplateBtn.click();
    await page.waitForTimeout(2500);

    // 1. Seleciona um template primeiro: confirmacao_webinario_astrologia
    const tplSelect = page.locator('button:has-text("Selecione o template")').first();
    await tplSelect.click();
    await page.waitForTimeout(1000);

    const firstTpl = page.locator('div.absolute.z-50 button:has-text("confirmacao_webinario_astrologia")').first();
    await firstTpl.click();
    await page.waitForTimeout(2000);

    // 2. Agora clica novamente no seletor para trocar de template (exatamente como o usuário fez!)
    const tplSelectAgain = page.locator('button:has-text("confirmacao_webinario_astrologia")').first();
    await tplSelectAgain.click();
    await page.waitForTimeout(1500);

    // Tira print do dropdown aberto com o template já selecionado por baixo
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'debug_dropdown_reopen_glitch.png'),
      fullPage: false
    });
    console.log('✅ Screenshot de debug capturada com sucesso!');

  } catch (err) {
    console.error('❌ Erro no teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
