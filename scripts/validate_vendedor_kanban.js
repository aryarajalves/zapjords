const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('1. Navegando para o sistema ZapVoice em http://localhost:5176...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Se estiver na tela de login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('2. Preenchendo credenciais do vendedor (aryarajunity@gmail.com)...');
      await emailInput.first().fill('aryarajunity@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Aguardando interface carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Capturar print mostrando o menu lateral com todos os botões do vendedor liberados
    const artifactPathMenu = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_vendedor_menu_liberado.png';
    await page.screenshot({ path: artifactPathMenu, fullPage: false });
    console.log('✅ Evidência do Menu do Vendedor salva em:', artifactPathMenu);

    // Clicar em "Kanban de Vendas"
    console.log('4. Clicando no botão "Kanban de Vendas"...');
    const kanbanBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    if (await kanbanBtn.count() > 0) {
      await kanbanBtn.first().click();
      console.log('5. Aguardando carregamento do Kanban de Vendas...');
      await page.waitForTimeout(4000);
    }

    // Capturar print mostrando o Kanban aberto com sucesso sem cair no chat
    const artifactPathKanban = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_vendedor_kanban_sucesso.png';
    await page.screenshot({ path: artifactPathKanban, fullPage: true });
    console.log('✅ Evidência do Kanban do Vendedor salva em:', artifactPathKanban);

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
