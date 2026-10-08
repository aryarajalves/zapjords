const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const dir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const brainDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\a9f4d023-a83c-4a76-9ecc-f4dfdfc25e09';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navegando para o ZapVoice...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });

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
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    await page.setViewportSize({ width: 1366, height: 900 });

    console.log('Abrindo Configurações...');
    await page.locator('aside button:has-text("Configurações")').click();
    await page.waitForTimeout(2000);

    console.log('Acessando aba Avançado...');
    await page.locator('button:has-text("Avançado")').click();
    await page.waitForTimeout(2000);

    // Verifica os valores nos inputs
    const urlVal = await page.locator('input[name="PLATFORM_API_URL"]').inputValue();
    const tokenVal = await page.locator('input[name="PLATFORM_API_TOKEN"]').inputValue();
    console.log(`Valores atuais: URL="${urlVal}" | TOKEN="${tokenVal}"`);

    const screenshotPath = path.join(dir, 'platform_settings_empty_verified.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot salvo em:', screenshotPath);

    if (fs.existsSync(brainDir)) {
      fs.copyFileSync(screenshotPath, path.join(brainDir, 'platform_settings_empty_verified.png'));
      console.log('Copiado para o brain:', path.join(brainDir, 'platform_settings_empty_verified.png'));
    }

    console.log('Sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    await page.screenshot({ path: path.join(dir, 'empty_test_error.png') });
  } finally {
    await browser.close();
  }
}

run();
