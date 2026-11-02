const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testContactEdit() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    console.log('1. Acessando frontend...');
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Login se necessário
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      console.log('2. Realizando login com aryarajmarketing@gmail.com...');
      await emailInput.type('aryarajmarketing@gmail.com');
      await page.type('input[type="password"]', '123456');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 3000));
    }

    console.log('3. Navegando para o Kanban ou Chat...');
    // Vamos navegar direto para o chat com telefone de um contato ou clicar na lista de conversas
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      const chatLink = links.find(el => el.textContent.includes('Conversas') || el.textContent.includes('Chat'));
      if (chatLink) chatLink.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    console.log('4. Procurando conversa na lista...');
    // Aguardar itens de conversa aparecerem
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('.group\\/convo, [role="button"], div[class*="group/convo"]');
      return items.length > 0;
    }, { timeout: 10000 });

    const clickedConvo = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.group\\/convo, div[class*="group/convo"]'));
      if (items.length > 0) {
        items[0].click();
        return items[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
      }
      return null;
    });

    console.log('Conversa selecionada:', clickedConvo);
    await new Promise(r => setTimeout(r, 3000));

    // Garantir que a sidebar lateral de contato está visível
    const isSidebarVisible = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-testid="contact-profile-card"], [data-testid="edit-contact-name-btn"]');
      return !!sidebar;
    });

    if (!isSidebarVisible) {
      console.log('5. Abrindo sidebar do contato...');
      await page.evaluate(() => {
        const toggleBtn = document.querySelector('[data-testid="toggle-chat-details-btn"]');
        if (toggleBtn) toggleBtn.click();
      });
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log('6. Clicando no botão de editar nome do contato...');
    await page.waitForSelector('[data-testid="edit-contact-name-btn"]', { timeout: 6000 });
    await page.click('[data-testid="edit-contact-name-btn"]');
    await new Promise(r => setTimeout(r, 800));

    console.log('7. Validando que o input de edição foi aberto...');
    await page.waitForSelector('[data-testid="edit-contact-name-input"]', { timeout: 3000 });
    
    // Simular o usuário apagando o nome do contato (pressionando backspace)
    console.log('8. Apagando caracteres com Backspace...');
    await page.focus('[data-testid="edit-contact-name-input"]');
    await page.keyboard.press('End');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 150));
    }

    console.log('9. Aguardando 6 segundos para testar contra o polling de 5 segundos...');
    // Espera mais que 5 segundos (período do setInterval do chat)
    await new Promise(r => setTimeout(r, 6500));

    // Validar se o input CONTINUA na tela e aberto
    const stillEditing = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="edit-contact-name-input"]');
      return !!input && !input.disabled;
    });

    console.log('Input continua aberto após mais de 6 segundos?', stillEditing);

    const artifactDir = 'C:/Users/aryar/.gemini/antigravity/brain/97d5a1f1-aa70-4136-a595-ff71f65d5e6f';
    const screenshotPath = path.join(artifactDir, 'evidencia_edicao_nome_contato_estavel.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot salva com sucesso em:', screenshotPath);

    if (!stillEditing) {
      throw new Error('Falha: o input fechou sozinho durante o polling!');
    }

    console.log('✅ TESTE VISUAL CONCLUÍDO COM SUCESSO! Edição 100% estável sem fechamento ou salto involuntário.');
  } catch (err) {
    console.error('Erro no teste:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testContactEdit();
