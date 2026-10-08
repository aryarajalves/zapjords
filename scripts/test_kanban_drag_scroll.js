const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navegando para http://localhost:5176...');
    await page.goto('http://localhost:5176', { timeout: 60000 });

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('Realizando login...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('Aguardando sidebar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    // Navegar para Kanban de Vendas
    console.log('Clicando em Kanban de Vendas...');
    const kanbanNavBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    if (await kanbanNavBtn.count() > 0) {
      await kanbanNavBtn.first().click();
      await page.waitForTimeout(3000);
    }

    // Aguardar container do Kanban
    const container = page.locator('[data-testid="kanban-drag-scroll-container"]');
    await container.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Container do Kanban visível!');

    const initialScroll = await container.evaluate(el => el.scrollLeft);
    console.log('Scroll horizontal inicial:', initialScroll);

    // Obter caixa delimitadora do container
    const box = await container.boundingBox();
    if (!box) throw new Error('Bounding box do container não encontrada');

    const startX = box.x + box.width - 200; // Começar na direita
    const startY = box.y + 100; // No topo do container (área do cabeçalho da coluna/espaço livre)
    const targetX = startX - 450; // Arrastar 450px para a esquerda

    console.log(`Iniciando drag scroll com botão esquerdo: de (${startX}, ${startY}) até (${targetX}, ${startY})...`);
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(targetX, startY, { steps: 25 });
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(1000);

    const finalScroll = await container.evaluate(el => el.scrollLeft);
    console.log('Scroll horizontal após arraste:', finalScroll);

    if (finalScroll > initialScroll) {
      console.log(`SUCESSO! O quadro rolou horizontalmente ${finalScroll - initialScroll}px via arraste do mouse.`);
    } else {
      console.log('Aviso: Scroll não variou como esperado. Verificando se há overflow suficiente.');
    }

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, 'kanban_vendas_after_drag_scroll.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot após arraste salvo em:', screenshotPath);

  } catch (error) {
    console.error('Erro no teste de drag scroll:', error);
  } finally {
    await browser.close();
  }
}

run();
