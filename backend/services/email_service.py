import os
from services.blocked_contacts_service import generate_unsubscribe_token
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
from core.logger import setup_logger
from core.encryption import decrypt_token

logger = setup_logger("email_service")

def inject_email_tracking(body_html: str, dispatch_id: int, recipient_email: str, base_url: str) -> str:
    """
    Injeta o pixel de rastreamento de abertura e envelopa links para rastreamento de cliques (CTR).
    """
    import base64
    import urllib.parse
    import re

    if not body_html or not dispatch_id:
        return body_html

    clean_email = str(recipient_email or "").strip().lower()
    rec_hash = base64.urlsafe_b64encode(clean_email.encode("utf-8")).decode("utf-8").rstrip("=")

    # 1. Envelopar links <a href="...">
    def replace_link(match):
        full_tag = match.group(0)
        attr_part = match.group(1)
        original_url = match.group(2)

        if (original_url.startswith("#") or
            original_url.startswith("mailto:") or
            original_url.startswith("tel:") or
            "unsubscribe" in original_url.lower() or
            "/track/" in original_url):
            return full_tag

        encoded_dest = urllib.parse.quote(original_url, safe="")
        track_url = f"{base_url}/api/email-marketing/track/click?d={dispatch_id}&r={rec_hash}&url={encoded_dest}"
        return full_tag.replace(attr_part, f'href="{track_url}"')

    link_pattern = re.compile(r'<a\s+[^>]*?(href=["\']([^"\']+)["\'])[^>]*?>', re.IGNORECASE)
    tracked_html = link_pattern.sub(replace_link, body_html)

    # 2. Injetar pixel invisível 1x1 para rastrear abertura
    pixel_url = f"{base_url}/api/email-marketing/track/open/{dispatch_id}/{rec_hash}"
    pixel_img = f'<img src="{pixel_url}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;outline:none;" />'

    if "</body>" in tracked_html.lower():
        idx = tracked_html.lower().rfind("</body>")
        tracked_html = tracked_html[:idx] + pixel_img + tracked_html[idx:]
    else:
        tracked_html = f"{tracked_html}\n{pixel_img}"

    return tracked_html

async def send_single_email(config, to_email: str, subject: str, body_html: str, recipient_name: str = None, dispatch_id: int = None) -> dict:
    """
    Envia um único e-mail utilizando a configuração do cliente (Amazon SES, Resend, Brevo ou SMTP).
    Suporta injeção automática de rastreamento de aberturas e cliques quando dispatch_id é fornecido.
    """
    if not config:
        return {"success": False, "error": "Configuração de e-mail não encontrada"}

    if not to_email or "@" not in to_email:
        return {"success": False, "error": "E-mail de destino inválido"}

    provider = (config.provider or "smtp").lower()
    from_name = config.from_name or "ZapVoice"
    from_email = config.from_email
    sender_header = f"{from_name} <{from_email}>" if from_name else from_email

    # Substituir variáveis dinâmicas do contato (suporta dict ou string com o nome)
    rec_dict = recipient_name if isinstance(recipient_name, dict) else {"name": str(recipient_name or "")}
    name_val = rec_dict.get("name") or rec_dict.get("nome") or ""
    first_name_val = str(name_val).strip().split()[0] if name_val else ""
    phone_val = rec_dict.get("phone") or rec_dict.get("telefone") or ""
    prod_val = rec_dict.get("product_name") or rec_dict.get("produto") or ""
    plat_val = rec_dict.get("platform") or rec_dict.get("plataforma") or ""
    price_val = rec_dict.get("price") or rec_dict.get("valor") or ""
    pay_val = rec_dict.get("payment_method") or rec_dict.get("forma_pagamento") or ""
    tags_val = rec_dict.get("tags") or rec_dict.get("etiquetas") or ""

    # Monta URL de descadastro única e segura
    client_id_val = getattr(config, "client_id", 1) or 1
    unsub_token = generate_unsubscribe_token(client_id_val, to_email)
    base_url = (os.getenv("WEBHOOK_BASE_URL") or os.getenv("VITE_API_URL") or "http://localhost:8000").rstrip("/")
    if base_url.endswith("/api"):
        unsub_url = f"{base_url}/email/unsubscribe-page?token={unsub_token}"
    else:
        unsub_url = f"{base_url}/api/email/unsubscribe-page?token={unsub_token}"

    replacements = {
        "{{nome}}": name_val,
        "{{name}}": name_val,
        "{{primeiro_nome}}": first_name_val,
        "{{first_name}}": first_name_val,
        "{{1}}": name_val,
        "{{email}}": to_email,
        "{{phone}}": phone_val,
        "{{telefone}}": phone_val,
        "{{produto}}": prod_val,
        "{{product_name}}": prod_val,
        "{{plataforma}}": plat_val,
        "{{platform}}": plat_val,
        "{{valor}}": price_val,
        "{{price}}": price_val,
        "{{forma_pagamento}}": pay_val,
        "{{payment_method}}": pay_val,
        "{{etiquetas}}": tags_val,
        "{{tags}}": tags_val,
        "{{unsubscribe_url}}": unsub_url,
    }

    for key, val in replacements.items():
        body_html = body_html.replace(key, str(val))
        subject = subject.replace(key, str(val))

    # Injetar rastreamento de abertura e cliques para campanhas/disparos com ID
    if dispatch_id:
        body_html = inject_email_tracking(body_html, dispatch_id, to_email, base_url)

    # 0. BREVO / SENDINBLUE (API HTTP v3)
    if provider == "brevo":
        brevo_key = decrypt_token(getattr(config, "brevo_api_key", None))
        if not brevo_key:
            return {"success": False, "error": "Chave API da Brevo não configurada"}
        try:
            payload = {
                "sender": {
                    "name": from_name,
                    "email": from_email
                },
                "to": [
                    {
                        "email": to_email,
                        "name": name_val or to_email
                    }
                ],
                "subject": subject,
                "htmlContent": body_html
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": brevo_key.strip(),
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    json=payload
                )
                if res.status_code in (200, 201, 202):
                    msg_id = res.json().get("messageId")
                    logger.info(f"📧 [EMAIL-BREVO] E-mail enviado para {to_email} | MessageId: {msg_id}")
                    return {"success": True, "message_id": msg_id}
                else:
                    err_msg = res.json().get("message") or res.text
                    logger.error(f"❌ [EMAIL-BREVO] Erro {res.status_code}: {err_msg}")
                    return {"success": False, "error": f"Brevo: {err_msg}"}
        except Exception as e:
            logger.error(f"❌ [EMAIL-BREVO] Exceção: {e}")
            return {"success": False, "error": str(e)}

    # 1. RESEND (API HTTP)
    elif provider == "resend":
        resend_key = decrypt_token(config.resend_api_key)
        if not resend_key:
            return {"success": False, "error": "Chave API do Resend não configurada"}
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key.strip()}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": sender_header,
                        "to": [to_email],
                        "subject": subject,
                        "html": body_html
                    }
                )
                if res.status_code in (200, 201):
                    logger.info(f"📧 [EMAIL-RESEND] E-mail enviado para {to_email}")
                    return {"success": True, "message_id": res.json().get("id")}
                else:
                    err_msg = res.json().get("message") or res.text
                    logger.error(f"❌ [EMAIL-RESEND] Erro {res.status_code}: {err_msg}")
                    return {"success": False, "error": f"Resend: {err_msg}"}
        except Exception as e:
            logger.error(f"❌ [EMAIL-RESEND] Exceção: {e}")
            return {"success": False, "error": str(e)}

    # 2. AMAZON SES (via Boto3 / API / SMTP)
    elif provider == "ses":
        aws_key = config.aws_access_key_id
        aws_secret = decrypt_token(config.aws_secret_access_key)
        region = config.aws_region or "us-east-1"

        if not aws_key or not aws_secret:
            return {"success": False, "error": "Credenciais AWS SES (Key ID e Secret Key) não informadas"}

        try:
            import boto3
            client = boto3.client(
                'ses',
                aws_access_key_id=aws_key.strip(),
                aws_secret_access_key=aws_secret.strip(),
                region_name=region.strip()
            )
            response = client.send_email(
                Source=sender_header,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {'Html': {'Data': body_html, 'Charset': 'UTF-8'}}
                }
            )
            message_id = response.get("MessageId")
            logger.info(f"📧 [EMAIL-SES] E-mail enviado para {to_email} | MessageID: {message_id}")
            return {"success": True, "message_id": message_id}
        except Exception as e_ses:
            logger.error(f"❌ [EMAIL-SES] Erro ao enviar via Amazon SES: {e_ses}")
            return {"success": False, "error": f"Amazon SES: {str(e_ses)}"}

    # 3. ENVIO DIRETO / SENDMAIL LOCAL (SEM CREDENCIAIS SMTP)
    elif provider in ("direct", "sendmail", "local"):
        try:
            domain = to_email.split("@")[-1]
            try:
                import dns.resolver
                records = dns.resolver.resolve(domain, 'MX')
                mx_record = str(records[0].exchange).rstrip('.')
            except Exception as e_dns:
                logger.warning(f"⚠️ [EMAIL-DIRECT] Resolução MX falhou ({e_dns}), usando fallback para '{domain}'")
                mx_record = domain  # Fallback direto pro domínio se o DNS falhar

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_header
            msg["To"] = to_email
            msg.attach(MIMEText(body_html, "html", "utf-8"))

            # Envia diretamente na porta 25 do servidor MX de destino
            server = smtplib.SMTP(mx_record, 25, timeout=15)
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            logger.info(f"📧 [EMAIL-DIRECT] E-mail enviado diretamente para {to_email} via MX {mx_record}")
            return {"success": True, "message_id": f"direct_{to_email}"}
        except Exception as e_direct:
            logger.error(f"❌ [EMAIL-DIRECT] Erro no envio direto: {e_direct}")
            return {"success": False, "error": f"Envio Direto: {str(e_direct)}"}

    # 4. SMTP CUSTOMIZADO (ou Fallback SMTP da SES)
    else:
        smtp_host = config.smtp_host
        smtp_port = config.smtp_port or 587
        smtp_user = config.smtp_user
        smtp_pass = decrypt_token(config.smtp_password)

        encryption = (config.smtp_encryption or "tls").lower()

        if not smtp_host:
            return {"success": False, "error": "Servidor SMTP Host não informado"}

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_header
            msg["To"] = to_email
            msg.attach(MIMEText(body_html, "html", "utf-8"))

            if encryption == "ssl" or smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
                if encryption != "none":
                    server.starttls()

            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)

            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            logger.info(f"📧 [EMAIL-SMTP] E-mail enviado para {to_email}")
            return {"success": True, "message_id": f"smtp_{to_email}"}
        except Exception as e_smtp:
            logger.error(f"❌ [EMAIL-SMTP] Erro ao enviar via SMTP: {e_smtp}")
            return {"success": False, "error": f"SMTP: {str(e_smtp)}"}
