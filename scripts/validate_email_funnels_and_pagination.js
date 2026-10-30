const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  console.log('Iniciando validação visual...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    console.log('Conectando em http://127.0.0.1:5176...');
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('Realizando login...');
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
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
    console.log('Abrindo E-mail Marketing...');
    const emailMarketingNav = page.locator('button:has-text("E-mail Marketing"), a:has-text("E-mail Marketing"), span:has-text("E-mail Marketing")').first();
    if (await emailMarketingNav.isVisible()) {
      await emailMarketingNav.click();
      await page.waitForTimeout(3000);
    }

    // 1. Clicar na aba "Funis de E-mail"
    console.log('Acessando aba Funis de E-mail...');
    const funnelsTab = page.locator('button:has-text("Funis de E-mail")').first();
    await funnelsTab.waitFor({ state: 'visible', timeout: 10000 });
    await funnelsTab.click();
    await page.waitForTimeout(2000);

    const shotFunnels = path.join(ARTIFACT_DIR, 'evidencia_funis_email_marketing.png');
    await page.screenshot({ path: shotFunnels });
    console.log('📸 Screenshot salvo:', shotFunnels);

    // 2. Clicar no botão "+ Novo Funil de E-mail"
    console.log('Abrindo Modal do Editor de Funil...');
    const newFunnelBtn = page.locator('button:has-text("Novo Funil de E-mail"), button:has-text("Criar Primeiro Funil")').first();
    if (await newFunnelBtn.isVisible()) {
      await newFunnelBtn.click();
      await page.waitForTimeout(2000);

      const shotEditor = path.join(ARTIFACT_DIR, 'evidencia_modal_editor_funil_email.png');
      await page.screenshot({ path: shotEditor });
      console.log('📸 Screenshot salvo:', shotEditor);

      // Clicar em Cancelar
      await page.locator('button:has-text("Cancelar")').first().click();
      await page.waitForTimeout(1000);
    }

    // 3. Acessar Histórico de Disparos para validar paginação de 20
    console.log('Acessando aba Histórico...');
    const historyTab = page.locator('button:has-text("Histórico")').first();
    await historyTab.click();
    await page.waitForTimeout(2000);

    // Clicar no badge de contatos do primeiro disparo
    const viewContactsBtn = page.locator('button[title*="destinatários"], button[title*="contatos"], span:has-text("🚀")').first();
    if (await viewContactsBtn.isVisible()) {
      await viewContactsBtn.click();
      await page.waitForTimeout(2000);

      const shotContacts = path.join(ARTIFACT_DIR, 'evidencia_modal_contatos_paginacao_20.png');
      await page.screenshot({ path: shotContacts });
      console.log('📸 Screenshot salvo:', shotContacts);
    }

    console.log('✅ Validação visual concluída com sucesso!');
  } catch (err) {
    console.error('Erro na validação Playwright:', err);
  } finally {
    await browser.close();
  }
}

run();
