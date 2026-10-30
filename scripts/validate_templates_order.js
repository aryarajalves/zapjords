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

    // Clica para abrir o dropdown de templates (exatamente como no print do usuário)
    const tplSelect = page.locator('button:has-text("Selecione o template")').first();
    await tplSelect.click();
    await page.waitForTimeout(2000);

    // Captura screenshot do dropdown aberto mostrando os templates criados por último no topo!
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_templates_ultimos_criados_no_topo.png'),
      fullPage: false
    });
    console.log('✅ Screenshot dos templates ordenados por mais recentes capturada!');

  } catch (err) {
    console.error('❌ Erro durante o teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
