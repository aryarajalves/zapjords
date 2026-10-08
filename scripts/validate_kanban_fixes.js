const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navegando para o frontend http://localhost:5176...');
    await page.goto('http://localhost:5176', { timeout: 60000 });

    // Login se estiver na tela de login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('Preenchendo credenciais de login...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('Configurando activeClientId como 14 (Cliente - Crassus)...');
    await page.evaluate(() => {
      localStorage.setItem('activeClientId', '14');
    });

    // Recarregar para garantir cliente 14 ativo
    await page.reload();
    await page.waitForTimeout(3000);

    console.log('Aguardando interface carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    // Clicar na aba "Kanban de Vendas"
    console.log('Acessando aba Kanban de Vendas...');
    const kanbanNavBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    if (await kanbanNavBtn.count() > 0) {
      await kanbanNavBtn.first().click();
      await page.waitForTimeout(3000);
    }

    // Aguardar o cabeçalho e as colunas do Kanban
    console.log('Aguardando quadro Kanban...');
    await page.waitForSelector('text=Kanban de Vendas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Identificar a coluna "VENDA CONCLUÍDA"
    console.log('Localizando coluna VENDA CONCLUÍDA e rolando até o fim...');
    const columns = page.locator('div:has-text("VENDA CONCLUÍDA")');
    const columnScrollables = page.locator('.overflow-y-auto.custom-scrollbar');
    const scrollCount = await columnScrollables.count();
    
    // Rola todas as colunas até o final
    for (let i = 0; i < scrollCount; i++) {
      const col = columnScrollables.nth(i);
      await col.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
    }

    await page.waitForTimeout(1500);

    // Screenshot 1: Prova dos últimos cards sem corte na coluna VENDA CONCLUÍDA
    const bottomProofPath = path.join(screenshotDir, 'kanban_bottom_cards_no_clipping.png');
    await page.screenshot({ path: bottomProofPath, fullPage: false });
    console.log('Screenshot 1 salvo em:', bottomProofPath);

    // Testar rolagem horizontal por auto-scroll com mouse na borda
    const boardContainer = page.locator('[data-testid="kanban-drag-scroll-container"]');
    const box = await boardContainer.boundingBox();
    if (box) {
      console.log('Simulando dragover na extremidade direita para verificar rolagem...');
      // Dispara evento dragover perto da borda direita
      await page.evaluate(({ rightEdge, yPos }) => {
        const evt = new MouseEvent('dragover', {
          bubbles: true,
          cancelable: true,
          clientX: rightEdge - 50,
          clientY: yPos
        });
        Object.defineProperty(evt, 'clientX', { value: rightEdge - 50 });
        window.dispatchEvent(evt);
      }, { rightEdge: box.x + box.width, yPos: box.y + 100 });
      await page.waitForTimeout(1000);
    }

    // Screenshot 2: Visão do Kanban com auto-scroll
    const finalProofPath = path.join(screenshotDir, 'kanban_full_view_improved.png');
    await page.screenshot({ path: finalProofPath, fullPage: false });
    console.log('Screenshot 2 salvo em:', finalProofPath);

  } catch (error) {
    console.error('Erro na validação Playwright:', error);
  } finally {
    await browser.close();
  }
}

run();
