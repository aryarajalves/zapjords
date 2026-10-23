const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Viewport compacta (1280x720) simulando tela com restrição vertical
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const artifactDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8';

  try {
    console.log('1. Acessando login...');
    await page.goto('http://localhost:5176', { timeout: 60000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[inputmode="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    console.log('2. Navegando para o Kanban de Vendas...');
    await page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")').first().click();
    await page.waitForTimeout(3000);

    console.log('3. Abrindo o modal de Nova Oportunidade...');
    const newDealBtn = page.locator('button:has-text("Nova Oportunidade")').first();
    await newDealBtn.waitFor({ state: 'visible', timeout: 8000 });
    await newDealBtn.click();
    await page.waitForTimeout(1500);

    console.log('4. Localizando select de Coluna / Estágio...');
    const stageSelect = page.locator('label:has-text("Coluna / Estágio") + select, div:has(> label:has-text("Coluna / Estágio")) select').first();
    
    // Obter todas as opções do estágio
    const options = await stageSelect.locator('option').allInnerTexts();
    console.log('Estágios disponíveis:', options);
    
    // Seleciona a opção de desistência
    for (let i = 0; i < options.length; i++) {
      if (options[i].toLowerCase().includes('desist')) {
        await stageSelect.selectOption({ index: i });
        console.log(`Selecionado estágio: ${options[i]}`);
        break;
      }
    }
    await page.waitForTimeout(1200);

    console.log('5. Capturando screenshot do modal com campo de Desistência aberto...');
    const destFile = path.join(artifactDir, 'deal_modal_desistencia_scroll_depois.png');
    await page.screenshot({ path: destFile, fullPage: false });
    console.log('Screenshot salvo com sucesso em:', destFile);

    console.log('6. Rolando o formulário para baixo até o final...');
    const formElem = page.locator('form');
    await formElem.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(600);

    const destFileBottom = path.join(artifactDir, 'deal_modal_desistencia_bottom_depois.png');
    await page.screenshot({ path: destFileBottom, fullPage: false });
    console.log('Screenshot final salvo com sucesso em:', destFileBottom);

    console.log('✅ Validação visual concluída com sucesso!');
  } catch (err) {
    console.error('Erro na captura:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
