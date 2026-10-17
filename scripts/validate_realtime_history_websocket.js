const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const dir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  try {
    await page.goto('http://localhost:5176');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });

    // Login
    console.log('Realizando login...');
    await page.locator('input[type="email"]').first().fill('aryarajmarketing@gmail.com');
    await page.locator('input[type="password"]').first().fill('123456');
    await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
    
    console.log('Aguardando painel principal...');
    await page.waitForTimeout(5000);
    
    // Selecionar cliente se não houver cliente ativo
    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      console.log('Nenhum cliente ativo. Selecionando o primeiro disponível...');
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }
    
    // Navegar para Integrações
    console.log('Navegando para Integrações...');
    await page.locator('aside button:has-text("Integrações")').click();
    await page.waitForTimeout(4000);

    // Print ANTES do envio do webhook em tempo real
    console.log('Capturando estado ANTES do novo dado no histórico...');
    const antesPath = path.join(dir, 'integrations_table_realtime_antes.png');
    await page.screenshot({ path: antesPath, fullPage: false });
    console.log('Screenshot Antes salvo em:', antesPath);

    // Clicar em "Testar" no primeiro registro da tabela
    console.log('Abrindo modal de teste de webhook...');
    await page.locator('button:has-text("Testar")').first().click();
    await page.waitForTimeout(2000);

    // Executar teste para gerar novo dado no histórico
    console.log('Disparando webhook de teste via UI...');
    await page.locator('button:has-text("Executar Teste")').click();
    
    // Aguardar evento de WebSocket refletir na interface
    console.log('Aguardando evento de WebSocket e efeito no botão/coluna de histórico...');
    await page.waitForTimeout(1500);

    // Print DEPOIS do webhook com efeito em tempo real na tabela
    console.log('Capturando estado DEPOIS com pulso e indicador no botão de Histórico...');
    const depoisTablePath = path.join(dir, 'integrations_table_realtime_depois.png');
    await page.screenshot({ path: depoisTablePath, fullPage: false });
    console.log('Screenshot Depois (Tabela) salvo em:', depoisTablePath);

    // Clicar no botão "Histórico" que acabou de receber o dado em tempo real
    console.log('Clicando no botão de Histórico com dados em tempo real...');
    await page.locator('button:has-text("Histórico")').first().click();
    await page.waitForTimeout(2500);

    // Print do Modal de Histórico aberto com o dado recebido
    console.log('Capturando estado do Modal de Histórico com o novo dado...');
    const depoisModalPath = path.join(dir, 'integrations_history_modal_realtime.png');
    await page.screenshot({ path: depoisModalPath, fullPage: false });
    console.log('Screenshot Depois (Modal Histórico) salvo em:', depoisModalPath);

    console.log(' Validação visual concluída com sucesso!');
  } catch (error) {
    console.error('Erro na validação visual:', error);
  } finally {
    await browser.close();
  }
}

run();
