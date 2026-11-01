const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'commit', timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log('Preenchendo login...');
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('button:has-text("Entrar")').click();
      await page.waitForTimeout(3000);
    }

    console.log('Navegando para E-mail Marketing...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('*'));
      const el = items.find(i => i.textContent && i.textContent.trim() === 'E-mail Marketing');
      if (el) el.click();
    });
    await page.waitForTimeout(2000);

    console.log('Acessando aba Histórico de Disparos...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Histórico'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);

    console.log('Abrindo modal de contatos do disparo...');
    // Clica no botão/ícone de ver contatos do primeiro disparo da lista
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.title && b.title.includes('contatos') || b.textContent.includes('contatos') || b.querySelector('svg'));
      // Procura botão na tabela de histórico
      const tableRows = document.querySelectorAll('tr');
      if (tableRows.length > 1) {
        const contactBtn = tableRows[1].querySelector('button');
        if (contactBtn) contactBtn.click();
      }
    });
    await page.waitForTimeout(2000);

    const outPath = path.join(ARTIFACT_DIR, 'evidencia_modal_contatos_backdrop_fullscreen.png');
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('✅ Screenshot do modal com backdrop de tela cheia salva em:', outPath);
  } catch (err) {
    console.error('Erro na automação:', err);
  } finally {
    await browser.close();
  }
}

run();
