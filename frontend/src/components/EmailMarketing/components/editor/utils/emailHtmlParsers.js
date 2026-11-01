// Variáveis disponíveis na aba de contatos
export const CONTACT_VARIABLES = [
  { code: '{{primeiro_nome}}', label: 'Primeiro Nome' },
  { code: '{{nome}}', label: 'Nome Completo' },
  { code: '{{email}}', label: 'E-mail' },
  { code: '{{phone}}', label: 'Telefone' },
  { code: '{{produto}}', label: 'Produto' },
  { code: '{{plataforma}}', label: 'Plataforma' },
  { code: '{{valor}}', label: 'Valor' },
  { code: '{{forma_pagamento}}', label: 'Pagamento' }
];

// Helper para converter a estrutura de blocos e estilos globais no HTML final responsivo de e-mail
export function exportBlocksToHtml(blocks, globalStyles) {
  const outerBg = globalStyles?.outerBgColor || '#b20505';
  const cardBg = globalStyles?.cardBgColor || '#ffffff';
  const cardWidth = globalStyles?.cardWidth || 600;
  const padding = globalStyles?.padding || 24;

  const renderedBlocks = (blocks || []).map(b => {
    switch (b.type) {
      case 'text':
        return `
          <div style="margin-bottom: 16px; font-family: Arial, sans-serif; font-size: ${b.fontSize || 15}px; color: ${b.color || '#334155'}; line-height: 1.6; text-align: ${b.textAlign || 'left'}; font-weight: ${b.fontWeight || 'normal'};">
            ${(b.content || '').replace(/\n/g, '<br />')}
          </div>
        `;

      case 'image':
        if (!b.url) return '';
        return `
          <div style="margin-bottom: 16px; text-align: ${b.align || 'center'};">
            <img src="${b.url}" alt="${b.alt || 'Imagem'}" style="max-width: 100%; height: auto; border-radius: ${b.borderRadius || 8}px; display: inline-block;" />
          </div>
        `;

      case 'button':
        return `
          <div style="margin-bottom: 20px; text-align: ${b.align || 'center'};">
            <a href="${b.url || '#'}" target="_blank" style="display: inline-block; padding: ${b.paddingY || 14}px ${b.paddingX || 28}px; background-color: ${b.bgColor || '#2563eb'}; color: ${b.textColor || '#ffffff'}; font-family: Arial, sans-serif; font-size: ${b.fontSize || 16}px; font-weight: bold; text-decoration: none; border-radius: ${b.borderRadius || 8}px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ${b.text || 'Clique Aqui'}
            </a>
          </div>
        `;

      case 'columns_2':
        return `
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
            <tr>
              <td width="48%" valign="top" style="padding-right: 2%; font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.5;">
                ${(b.col1Text || 'Coluna 1').replace(/\n/g, '<br />')}
              </td>
              <td width="48%" valign="top" style="padding-left: 2%; font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.5;">
                ${(b.col2Text || 'Coluna 2').replace(/\n/g, '<br />')}
              </td>
            </tr>
          </table>
        `;

      case 'divider':
        return `
          <hr style="border: 0; border-top: ${b.thickness || 1}px solid ${b.color || '#e2e8f0'}; margin: ${b.margin || 20}px 0;" />
        `;

      case 'video':
        return `
          <div style="margin-bottom: 16px; text-align: center;">
            <video controls width="100%" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; display: block;">
              <source src="${b.url || '#'}" type="video/mp4">
              Seu navegador não suporta a exibição de vídeos.
            </video>
            <a href="${b.url || '#'}" target="_blank" style="text-decoration: none; display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #ffffff; border-radius: 6px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold;">
              ▶️ Assistir ao Vídeo: ${b.title || 'Clique para Assistir'}
            </a>
          </div>
        `;

      case 'list': {
        const items = b.items || [];
        const isNum = b.styleType === 'number';
        const listItemsHtml = items.map(item => {
          let bulletSpan = '';
          if (b.styleType === 'arrow') bulletSpan = `<span style="color: ${b.bulletColor || '#3b82f6'}; font-weight: bold; margin-right: 8px;">→</span>`;
          else if (b.styleType === 'check') bulletSpan = `<span style="color: ${b.bulletColor || '#10b981'}; font-weight: bold; margin-right: 8px;">✓</span>`;
          else if (b.styleType === 'bullet') bulletSpan = `<span style="color: ${b.bulletColor || '#3b82f6'}; font-weight: bold; margin-right: 8px;">•</span>`;

          return `<li style="margin-bottom: ${b.spacing || 8}px; line-height: 1.6; ${isNum ? '' : 'list-style-type: none;'}">${bulletSpan}${item}</li>`;
        }).join('');

        return `
          <div style="margin-bottom: 18px; font-family: Arial, sans-serif; font-size: ${b.fontSize || 15}px; color: ${b.color || '#334155'};" data-block-type="list" data-style-type="${b.styleType || 'bullet'}">
            <${isNum ? 'ol' : 'ul'} style="margin: 0; padding-left: ${isNum ? '24px' : '4px'};">
              ${listItemsHtml}
            </${isNum ? 'ol' : 'ul'}>
          </div>
        `;
      }

      case 'social': {
        const radius = b.iconStyle === 'circle' ? '50%' : '6px';
        const links = [];
        if (b.showInstagram !== false && b.instagram) {
          links.push(`<a href="${b.instagram}" target="_blank" style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; text-decoration: none; margin: 0 5px; background: #e1306c; color: #ffffff; border-radius: ${radius}; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold;">ig</a>`);
        }
        if (b.showYoutube !== false && b.youtube) {
          links.push(`<a href="${b.youtube}" target="_blank" style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; text-decoration: none; margin: 0 5px; background: #ff0000; color: #ffffff; border-radius: ${radius}; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">yt</a>`);
        }
        if (b.showFacebook !== false && b.facebook) {
          links.push(`<a href="${b.facebook}" target="_blank" style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; text-decoration: none; margin: 0 5px; background: #1877f2; color: #ffffff; border-radius: ${radius}; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold;">f</a>`);
        }
        if (b.showTwitter !== false && b.twitter) {
          links.push(`<a href="${b.twitter}" target="_blank" style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; text-decoration: none; margin: 0 5px; background: #0f1419; color: #ffffff; border-radius: ${radius}; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold;">𝕏</a>`);
        }
        if (b.showTiktok && b.tiktok) {
          links.push(`<a href="${b.tiktok}" target="_blank" style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; text-decoration: none; margin: 0 5px; background: #000000; color: #ffffff; border-radius: ${radius}; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">tt</a>`);
        }
        if (b.showWebsite !== false && b.website) {
          links.push(`<a href="${b.website}" target="_blank" style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; text-decoration: none; margin: 0 5px; background: #2563eb; color: #ffffff; border-radius: ${radius}; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold;">🌐</a>`);
        }

        return `
          <div style="margin: 16px 0; text-align: ${b.align || 'center'};" data-block-type="social">
            ${links.join('')}
          </div>
        `;
      }

      case 'footer': {
        return `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: Arial, sans-serif; font-size: ${b.fontSize || 11}px; color: ${b.color || '#64748b'}; text-align: ${b.align || 'center'}; line-height: 1.6;" data-block-type="footer">
            ${b.companyName ? `<div style="font-weight: bold; margin-bottom: 4px;">${b.companyName}</div>` : ''}
            ${b.address ? `<div style="margin-bottom: 6px;">${b.address}</div>` : ''}
            ${b.customText ? `<div style="margin-bottom: 6px; font-style: italic;">${b.customText}</div>` : ''}
            <div style="margin-top: 6px; font-size: 10px;">
              Enviado para: <u>${b.recipientEmail || '{{email}}'}</u> &nbsp;|&nbsp; 
              <a href="${b.unsubscribeUrl || '{{unsubscribe_url}}'}" target="_blank" style="color: #2563eb; text-decoration: underline;">Cancelar a inscrição</a>
            </div>
          </div>
        `;
      }

      default:
        return '';
    }
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-mail Marketing</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${outerBg}; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${outerBg}; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: ${cardWidth}px; background-color: ${cardBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: ${padding}px;">
              ${renderedBlocks}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Parser para re-converter o HTML salvo de volta em blocos editáveis no Drag & Drop
export function parseHtmlToBlocks(html) {
  if (!html || typeof html !== 'string' || !html.trim()) return null;

  try {
    let outerBg = '#b20505';
    const bgMatch = html.match(/background-color:\s*([^;"]+)/i);
    if (bgMatch && bgMatch[1]) {
      const foundBg = bgMatch[1].trim();
      if (foundBg && foundBg !== 'inherit' && foundBg !== 'transparent') {
        outerBg = foundBg;
      }
    }

    if (typeof window !== 'undefined' && window.DOMParser) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const cardTd = doc.querySelector('td[style*="padding"]') || doc.querySelector('table td') || doc.body;
      const children = Array.from(cardTd.children);

      const blocks = [];

      if (children.length > 0) {
        children.forEach((el, idx) => {
          const id = `b-restored-${idx}-${Date.now()}`;
          const textContent = el.textContent || '';
          const innerHtml = el.innerHTML || '';

          // 1. Imagem
          const img = el.querySelector('img') || (el.tagName === 'IMG' ? el : null);
          if (img) {
            blocks.push({
              id,
              type: 'image',
              url: img.getAttribute('src') || '',
              alt: img.getAttribute('alt') || 'Imagem',
              align: el.style?.textAlign || img.parentElement?.style?.textAlign || 'center',
              borderRadius: 8
            });
            return;
          }

          // 2. Vídeo
          if (textContent.includes('Assistir ao Vídeo') || el.querySelector('video') || el.tagName === 'VIDEO') {
            const aTag = el.querySelector('a');
            const videoTag = el.querySelector('video');
            const titleMatch = textContent.replace(/▶️\s*Assistir ao Vídeo:\s*/i, '').trim();
            blocks.push({
              id,
              type: 'video',
              title: titleMatch || 'Vídeo',
              url: aTag?.getAttribute('href') || videoTag?.querySelector('source')?.getAttribute('src') || 'https://'
            });
            return;
          }

          // 3. Botão CTA
          const btnAnchor = el.querySelector('a[style*="background-color"]') || (el.tagName === 'A' && el.style?.backgroundColor ? el : null);
          if (btnAnchor) {
            const bgColor = btnAnchor.style?.backgroundColor || '#2563eb';
            const textColor = btnAnchor.style?.color || '#ffffff';
            blocks.push({
              id,
              type: 'button',
              text: btnAnchor.textContent?.trim() || 'Clique Aqui',
              url: btnAnchor.getAttribute('href') || 'https://',
              bgColor,
              textColor,
              align: el.style?.textAlign || 'center',
              borderRadius: 8
            });
            return;
          }

          // 4. Divisor HR
          if (el.querySelector('hr') || el.tagName === 'HR') {
            const hr = el.querySelector('hr') || (el.tagName === 'HR' ? el : null);
            const styleAttr = hr?.getAttribute('style') || '';
            const borderTopMatch = styleAttr.match(/border-top:\s*(\d+)px\s+solid\s+([^;"]+)/i);
            const marginMatch = styleAttr.match(/margin:\s*(\d+)px/i);

            blocks.push({
              id,
              type: 'divider',
              thickness: borderTopMatch ? Number(borderTopMatch[1]) : 1,
              color: borderTopMatch ? borderTopMatch[2].trim() : '#e2e8f0',
              margin: marginMatch ? Number(marginMatch[1]) : 20
            });
            return;
          }

          // 5. Duas colunas (tabela interna)
          if (el.tagName === 'TABLE' && el.querySelectorAll('td').length >= 2) {
            const tds = el.querySelectorAll('td');
            blocks.push({
              id,
              type: 'columns_2',
              col1Text: (tds[0]?.innerHTML || tds[0]?.textContent || '').replace(/<br\s*\/?>/gi, '\n').trim(),
              col2Text: (tds[1]?.innerHTML || tds[1]?.textContent || '').replace(/<br\s*\/?>/gi, '\n').trim()
            });
            return;
          }

          // 6. Lista Estruturada (list)
          if (el.getAttribute('data-block-type') === 'list' || el.tagName === 'UL' || el.tagName === 'OL') {
            const listEl = el.querySelector('ul, ol') || el;
            const isOl = listEl.tagName === 'OL';
            const styleType = el.getAttribute('data-style-type') || (isOl ? 'number' : 'bullet');
            const items = Array.from(listEl.querySelectorAll('li')).map(li => {
              // Limpa bullets customizados (→, ✓, •) inseridos em span
              const span = li.querySelector('span');
              if (span && (span.textContent === '→' || span.textContent === '✓' || span.textContent === '•')) {
                span.remove();
              }
              return (li.textContent || '').trim();
            }).filter(Boolean);

            const fontSizeMatch = el.getAttribute('style')?.match(/font-size:\s*(\d+)px/i);
            const colorMatch = el.getAttribute('style')?.match(/color:\s*([^;"]+)/i);

            blocks.push({
              id,
              type: 'list',
              items: items.length > 0 ? items : ['Item da lista'],
              styleType: styleType || 'bullet',
              bulletColor: '#3b82f6',
              fontSize: fontSizeMatch ? Number(fontSizeMatch[1]) : 15,
              color: colorMatch ? colorMatch[1].trim() : '#334155',
              spacing: 8
            });
            return;
          }

          // 7. Redes Sociais (social)
          if (el.getAttribute('data-block-type') === 'social' || (el.querySelectorAll('a').length >= 2 && textContent.includes('ig'))) {
            const anchors = Array.from(el.querySelectorAll('a'));
            let instagram = '';
            let youtube = '';
            let facebook = '';
            let twitter = '';
            let tiktok = '';
            let website = '';

            anchors.forEach(a => {
              const href = a.getAttribute('href') || '';
              const text = (a.textContent || '').trim().toLowerCase();
              if (href.includes('instagram.com') || text === 'ig') instagram = href;
              else if (href.includes('youtube.com') || text === 'yt') youtube = href;
              else if (href.includes('facebook.com') || text === 'f') facebook = href;
              else if (href.includes('twitter.com') || href.includes('x.com') || text === '𝕏') twitter = href;
              else if (href.includes('tiktok.com') || text === 'tt') tiktok = href;
              else if (text === '🌐' || href) website = href;
            });

            const alignMatch = el.getAttribute('style')?.match(/text-align:\s*([^;"]+)/i);

            blocks.push({
              id,
              type: 'social',
              align: alignMatch ? alignMatch[1].trim() : 'center',
              iconStyle: 'circle',
              showInstagram: !!instagram,
              instagram: instagram || 'https://instagram.com/',
              showYoutube: !!youtube,
              youtube: youtube || 'https://youtube.com/',
              showFacebook: !!facebook,
              facebook: facebook || 'https://facebook.com/',
              showTwitter: !!twitter,
              twitter: twitter || 'https://x.com/',
              showTiktok: !!tiktok,
              tiktok: tiktok || 'https://tiktok.com/',
              showWebsite: !!website,
              website: website || 'https://seudominio.com'
            });
            return;
          }

          // 8. Rodapé Institucional / Descadastro (footer)
          if (el.getAttribute('data-block-type') === 'footer' || textContent.includes('Cancelar a inscrição') || textContent.includes('Enviado para:')) {
            const divs = el.querySelectorAll('div');
            let companyName = '';
            let address = '';
            let customText = '';
            let unsubscribeUrl = '{{unsubscribe_url}}';
            let recipientEmail = '{{email}}';

            const unsubsAnchor = el.querySelector('a[href]');
            if (unsubsAnchor) unsubscribeUrl = unsubsAnchor.getAttribute('href') || '{{unsubscribe_url}}';

            const emailUnderline = el.querySelector('u');
            if (emailUnderline) recipientEmail = emailUnderline.textContent?.trim() || '{{email}}';

            if (divs.length >= 3) {
              companyName = divs[0]?.textContent?.trim() || '';
              address = divs[1]?.textContent?.trim() || '';
              if (divs.length >= 4) {
                customText = divs[2]?.textContent?.trim() || '';
              }
            } else if (divs.length >= 1) {
              companyName = divs[0]?.textContent?.trim() || '';
            }

            const fontSizeMatch = el.getAttribute('style')?.match(/font-size:\s*(\d+)px/i);
            const colorMatch = el.getAttribute('style')?.match(/color:\s*([^;"]+)/i);
            const alignMatch = el.getAttribute('style')?.match(/text-align:\s*([^;"]+)/i);

            blocks.push({
              id,
              type: 'footer',
              companyName: companyName || 'Sua Empresa LTDA',
              address: address || 'Av. Paulista, 1000 - São Paulo, SP',
              customText: customText || 'Você está recebendo este e-mail porque se cadastrou em nossa lista.',
              unsubscribeUrl,
              recipientEmail,
              fontSize: fontSizeMatch ? Number(fontSizeMatch[1]) : 11,
              color: colorMatch ? colorMatch[1].trim() : '#64748b',
              align: alignMatch ? alignMatch[1].trim() : 'center'
            });
            return;
          }

          // 6. Texto / HTML Geral
          let cleanContent = innerHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n').trim();
          if (!cleanContent) cleanContent = textContent.trim();

          if (cleanContent) {
            const fontSizeMatch = el.getAttribute('style')?.match(/font-size:\s*(\d+)px/i);
            const colorMatch = el.getAttribute('style')?.match(/color:\s*([^;"]+)/i);
            const alignMatch = el.getAttribute('style')?.match(/text-align:\s*([^;"]+)/i);

            blocks.push({
              id,
              type: 'text',
              content: cleanContent,
              fontSize: fontSizeMatch ? Number(fontSizeMatch[1]) : 16,
              color: colorMatch ? colorMatch[1].trim() : '#1e293b',
              textAlign: alignMatch ? alignMatch[1].trim() : 'left'
            });
          }
        });
      }

      if (blocks.length > 0) {
        return {
          globalStyles: { outerBgColor: outerBg, cardBgColor: '#ffffff', cardWidth: 600, padding: 24 },
          blocks
        };
      }
    }
  } catch (err) {
    console.error('Erro ao restaurar blocos de HTML:', err);
  }

  // Fallback se não for HTML estruturado: criar um bloco de texto com todo o conteúdo
  const cleanRawText = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '').trim();
  if (cleanRawText) {
    return {
      globalStyles: { outerBgColor: '#b20505', cardBgColor: '#ffffff', cardWidth: 600, padding: 24 },
      blocks: [
        {
          id: `b-fallback-${Date.now()}`,
          type: 'text',
          content: cleanRawText,
          fontSize: 16,
          color: '#1e293b',
          textAlign: 'left'
        }
      ]
    };
  }

  return null;
}
