const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
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
      await page.waitForTimeout(4000);
    }

    console.log('URL atual:', page.url());

    // Clica no menu E-mail Marketing no sidebar
    console.log('Navegando para E-mail Marketing...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('*'));
      const el = items.find(i => i.textContent && i.textContent.trim() === 'E-mail Marketing');
      if (el) el.click();
    });
    await page.waitForTimeout(2500);

    // Clica na aba Templates de E-mail
    console.log('Clicando na aba Templates...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Templates'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);

    // Clica em "Novo Template"
    console.log('Clicando em Novo Template...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Novo Template'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(2500);

    // Screenshot 1: Com o editor de template aberto e a barra lateral exibindo o botão Maximizar e as variáveis
    console.log('Capturando evidência 1: Editor com botão Maximizar e atalhos de variáveis...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_campo_texto_com_variaveis_e_maximizar.png'),
      fullPage: true
    });

    // Clica no botão "Maximizar"
    console.log('Clicando no botão Maximizar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Maximizar'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(1500);

    // No modal aberto, clica em {{primeiro_nome}}
    console.log('Clicando na variável {{primeiro_nome}} dentro do modal expandido...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('{{primeiro_nome}}'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(800);

    // Screenshot 2: Modal expandido em tela cheia com texto e variáveis
    console.log('Capturando evidência 2: Modal de texto maximizado com variáveis dinâmicas...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_modal_texto_maximizado.png'),
      fullPage: true
    });

    console.log('✅ Ambas as evidências visuais foram geradas com sucesso absoluto!');
  } catch (err) {
    console.error('Erro na execução:', err);
  } finally {
    await browser.close();
  }
}

run();
