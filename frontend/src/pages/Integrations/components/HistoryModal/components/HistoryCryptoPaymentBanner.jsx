import React from 'react';
import { FiCpu, FiCheckCircle } from 'react-icons/fi';

export default function HistoryCryptoPaymentBanner({ processed }) {
  if (!processed) return null;

  const isCrypto = Boolean(
    processed.is_crypto ||
    processed.crypto_currency ||
    processed.crypto_amount ||
    String(processed.payment_method || '').toLowerCase().includes('cripto') ||
    String(processed.payment_method || '').toLowerCase().includes('crypto') ||
    processed.custom_fields?.['Meio de Pagamento'] === 'Criptomoeda'
  );

  if (!isCrypto) return null;

  const currency = processed.crypto_currency || 'USDT';
  const amount = processed.crypto_amount || processed.custom_fields?.['Cripto Valor'] || '-';
  const network = processed.crypto_network || processed.custom_fields?.['Rede Cripto'] || '-';
  const gateway = processed.gateway_name || processed.custom_fields?.['Gateway'] || 'NOWPayments';
  const orderCode = processed.order_code || processed.custom_fields?.['Código Pedido'] || '-';
  const wallet = processed.crypto_wallet_address || processed.custom_fields?.['Carteira'];
  const extTx = processed.external_transaction_id;

  return (
    <div className="mb-4 relative z-10 rounded-xl overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-blue-950/40 shadow-lg shadow-emerald-950/20">
      <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
            <FiCpu size={14} />
          </span>
          <span className="text-emerald-400 font-black uppercase tracking-widest text-[11px]">
            Pagamento em Criptomoeda Confirmado
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {gateway.toUpperCase()}
        </span>
      </div>

      <div className="p-3.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
        <div className="bg-white/5 dark:bg-black/30 p-2 rounded-lg border border-emerald-500/10">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Valor Pago</span>
          <span className="font-extrabold text-emerald-400 text-[12px]">
            {amount} {currency}
          </span>
        </div>

        <div className="bg-white/5 dark:bg-black/30 p-2 rounded-lg border border-emerald-500/10">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Rede Blockchain</span>
          <span className="font-bold text-gray-200">
            {network}
          </span>
        </div>

        <div className="bg-white/5 dark:bg-black/30 p-2 rounded-lg border border-emerald-500/10">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Código Pedido</span>
          <span className="font-mono text-gray-300 text-[10px] truncate block" title={orderCode}>
            {orderCode}
          </span>
        </div>

        <div className="bg-white/5 dark:bg-black/30 p-2 rounded-lg border border-emerald-500/10">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Status Gateway</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <FiCheckCircle size={11} /> Confirmado
          </span>
        </div>

        {wallet && (
          <div className="col-span-2 md:col-span-4 bg-white/5 dark:bg-black/30 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-medium">Carteira Destino:</span>
            <span className="font-mono text-emerald-300 select-all truncate ml-2" title={wallet}>
              {wallet}
            </span>
          </div>
        )}

        {extTx && (
          <div className="col-span-2 md:col-span-4 flex items-center justify-between px-1 text-[10px] text-gray-400">
            <span>ID Transação Externa:</span>
            <span className="font-mono text-gray-300">{extTx}</span>
          </div>
        )}
      </div>
    </div>
  );
}
