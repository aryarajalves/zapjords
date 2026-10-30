const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  console.log('Iniciando validação visual do modal de exclusão com backdrop em tela inteira...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    await page.goto('http://localhost:5176', { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('Realizando login...');
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(3500);
    }

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      console.log('Selecionando cliente...');
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    // Navegar para E-mail Marketing
    console.log('Navegando para E-mail Marketing...');
    const emailMarketingNav = page.locator('button:has-text("E-mail Marketing"), a:has-text("E-mail Marketing"), span:has-text("E-mail Marketing")').first();
    if (await emailMarketingNav.isVisible()) {
      await emailMarketingNav.click();
      await page.waitForTimeout(2500);
    }

    // Acessar aba Funis de E-mail
    console.log('Acessando aba Funis de E-mail...');
    const funnelsTab = page.locator('button:has-text("Funis de E-mail")').first();
    await funnelsTab.waitFor({ state: 'visible', timeout: 10000 });
    await funnelsTab.click();
    await page.waitForTimeout(1500);

    // Clicar no botão da lixeira de um funil para abrir o modal de exclusão
    console.log('Abrindo modal de exclusão...');
    const trashBtn = page.locator('button[title="Excluir Funil"]').first();
    if (await trashBtn.isVisible()) {
      await trashBtn.click();
      await page.waitForTimeout(1500);
    }

    const shotModal = path.join(ARTIFACT_DIR, 'evidencia_modal_exclusao_funil_tela_inteira.png');
    await page.screenshot({ path: shotModal });
    console.log('📸 Screenshot do modal com backdrop em tela inteira salvo:', shotModal);

  } catch (err) {
    console.error('Erro na validação Playwright:', err);
  } finally {
    await browser.close();
  }
}

run();
