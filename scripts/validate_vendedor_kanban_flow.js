const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('1. Navegando para http://localhost:5176...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Se estiver no login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('2. Logando com vendedor aryarajunity@gmail.com...');
      await emailInput.first().fill('aryarajunity@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Verificando estado da tela...');
    // Se o chat estiver aberto, fechar ou clicar no atalho Kanban
    const closeChatBtn = page.locator('[data-testid="chat-header-close-nav-btn"]');
    if (await closeChatBtn.count() > 0 && await closeChatBtn.first().isVisible()) {
      console.log('Chat aberto em tela cheia detectado. Fechando chat para exibir menu lateral...');
      await closeChatBtn.first().click();
      await page.waitForTimeout(2000);
    }

    // Agora o sidebar está visível
    console.log('4. Capturando tela do menu lateral do vendedor...');
    const artifactMenu = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_vendedor_menu_liberado.png';
    await page.screenshot({ path: artifactMenu, fullPage: false });
    console.log('✅ Evidência do Menu do Vendedor salva em:', artifactMenu);

    // Clicar no Kanban de Vendas
    console.log('5. Clicando em "Kanban de Vendas" no menu...');
    const kanbanBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    await kanbanBtn.first().click();
    await page.waitForTimeout(3500);

    // Capturar tela do Kanban de Vendas aberto com sucesso
    const artifactKanban = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f\\evidencia_vendedor_kanban_sucesso.png';
    await page.screenshot({ path: artifactKanban, fullPage: false });
    console.log('✅ Evidência do Kanban do Vendedor salva em:', artifactKanban);

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
