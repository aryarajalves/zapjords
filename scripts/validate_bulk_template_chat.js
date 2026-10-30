const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    const chatNavBtn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first();
    if (await chatNavBtn.isVisible()) {
      await chatNavBtn.click();
      await page.waitForTimeout(4000);
    }

    // Selecionar conversas
    const selectAllBtn = page.locator('button:has-text("Selecionar todas")').first();
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      await page.waitForTimeout(1500);
    }

    // Clicar em Disparo Template
    const bulkTemplateBtn = page.locator('#bulk-template-btn');
    await bulkTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await bulkTemplateBtn.click();
    await page.waitForTimeout(2500);

    // Abrir seletor de templates
    const tplSelect = page.locator('button:has-text("Selecione o template")').first();
    if (await tplSelect.isVisible()) {
      await tplSelect.click();
      await page.waitForTimeout(1000);

      // Listar opções disponíveis
      const options = page.locator('div.absolute.z-50 button');
      const count = await options.count();
      console.log(`Templates disponíveis no dropdown: ${count}`);

      let clicked = false;
      for (let i = 1; i < count; i++) {
        const text = await options.nth(i).innerText();
        console.log(`Option #${i}: ${text.replace(/\n/g, ' ')}`);
        // Procura template promocional ou com botões
        if (text.toLowerCase().includes('black') || text.toLowerCase().includes('oferta') || text.toLowerCase().includes('botao') || text.toLowerCase().includes('quiz') || text.toLowerCase().includes('pesquisa') || i === 2) {
          await options.nth(i).click();
          clicked = true;
          break;
        }
      }
      if (!clicked && count > 1) {
        await options.nth(1).click();
      }
      await page.waitForTimeout(2000);
    }

    // Scroll para exibir configurações
    const followupToggle = page.locator('text=Follow-up').first();
    if (await followupToggle.isVisible()) {
      await followupToggle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }

    // Screenshot detalhada
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_modal_disparo_template_detalhado.png'),
      fullPage: false
    });
    console.log('✅ Screenshot detalhada capturada com sucesso!');

  } catch (err) {
    console.error('❌ Erro durante o teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
