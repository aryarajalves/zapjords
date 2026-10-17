import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HistoryCryptoPaymentBanner from '../HistoryCryptoPaymentBanner';

describe('HistoryCryptoPaymentBanner', () => {
  it('não deve renderizar nada se o payload não for de criptomoeda', () => {
    const { container } = render(<HistoryCryptoPaymentBanner processed={{ payment_method: 'credit_card' }} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar o banner completo com dados de criptomoeda quando is_crypto for true', () => {
    const processed = {
      is_crypto: true,
      crypto_currency: 'USDT',
      crypto_amount: 15.023445,
      crypto_network: 'Polygon',
      crypto_wallet_address: '0x9F614C09fD8C0E217B0725E5D475241ADB27A6f7',
      gateway_name: 'nowpayments',
      order_code: 'ORD-20261016-202796',
      payment_method: 'Criptomoeda'
    };

    render(<HistoryCryptoPaymentBanner processed={processed} />);

    expect(screen.getByText(/Pagamento em Criptomoeda Confirmado/i)).toBeInTheDocument();
    expect(screen.getByText('NOWPAYMENTS')).toBeInTheDocument();
    expect(screen.getByText(/15.023445 USDT/i)).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
    expect(screen.getByText('ORD-20261016-202796')).toBeInTheDocument();
    expect(screen.getByText('0x9F614C09fD8C0E217B0725E5D475241ADB27A6f7')).toBeInTheDocument();
  });

  it('deve renderizar a partir dos custom_fields se os campos de topo não existirem', () => {
    const processed = {
      payment_method: 'crypto',
      custom_fields: {
        'Meio de Pagamento': 'Criptomoeda',
        'Cripto Valor': '15.02 USDT',
        'Rede Cripto': 'Polygon',
        'Gateway': 'NOWPAYMENTS',
        'Código Pedido': 'ORD-999'
      }
    };

    render(<HistoryCryptoPaymentBanner processed={processed} />);
    expect(screen.getByText(/Pagamento em Criptomoeda Confirmado/i)).toBeInTheDocument();
    expect(screen.getByText(/15.02 USDT/i)).toBeInTheDocument();
  });
});
