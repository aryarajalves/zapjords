import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Infrastructure from '../index';

// Mock de ícones do react-icons/fi
vi.mock('react-icons/fi', () => ({
  FiServer: () => <span data-testid="icon-server" />,
  FiCpu: () => <span data-testid="icon-cpu" />,
  FiDatabase: () => <span data-testid="icon-database" />,
  FiBell: () => <span data-testid="icon-bell" />,
  FiRefreshCw: () => <span data-testid="icon-refresh" />,
  FiClock: () => <span data-testid="icon-clock" />,
  FiHardDrive: () => <span data-testid="icon-harddrive" />,
  FiTrendingUp: () => <span data-testid="icon-trending-up" />,
  FiCheckCircle: () => <span data-testid="icon-check-circle" />,
  FiAlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  FiInfo: () => <span data-testid="icon-info" />,
  FiLayers: () => <span data-testid="icon-layers" />,
  FiSliders: () => <span data-testid="icon-sliders" />,
  FiSend: () => <span data-testid="icon-send" />,
  FiSave: () => <span data-testid="icon-save" />,
  FiShieldAlert: () => <span data-testid="icon-shield-alert" />,
}));

// Mock do hook useInfrastructure
const mockFetchMetrics = vi.fn();
const mockSaveSettings = vi.fn();
const mockTestWebhook = vi.fn();
const mockSetSettings = vi.fn();

const mockMetricsData = {
  hardware: {
    ram: {
      used_gb: 1.68,
      total_gb: 4.0,
      free_gb: 2.32,
      percent: 42.1,
      api_process_mb: 142,
      status: 'Saudável',
    },
    cpu: {
      percent: 12.4,
      vcpu_count: 2,
      status: 'Normal',
    },
  },
  database: {
    in_use: 4,
    pool_total: 30,
    pool_base: 10,
    pool_overflow: 20,
    idle_in_pool: 26,
    occupancy_percent: 13.3,
    status: 'Saudável',
  },
  peaks: {
    ram: { percent: 58.3, used_gb: 2.33, recorded_at: '23/10/2026 14:32:10' },
    cpu: { percent: 45.0, recorded_at: '23/10/2026 15:10:04' },
    connections: {
      peak: 8,
      pool_total: 30,
      occupancy_percent: 26.7,
      recorded_at: '23/10/2026 09:15:22',
      status: 'Pico Seguro',
    },
  },
  history: [
    {
      period: '23/10/2026 11:00',
      peak_connections: '4 ativas',
      occupancy_percent: '13.3%',
      status: 'Normal',
    },
  ],
  webhook_badge: 'Ativo',
  timestamp: '23/10/2026 11:30:00 (Horário de Brasília)',
};

const mockSettingsData = {
  alert_pool_enabled: true,
  alert_pool_threshold: 75,
  alert_ram_enabled: true,
  alert_ram_threshold: 80,
  alert_cpu_enabled: true,
  alert_cpu_threshold: 85,
  cooldown_minutes: 15,
  webhook_url: 'https://discord.com/api/webhooks/123/xyz',
  notify_normalized: true,
};

vi.mock('../hooks/useInfrastructure', () => ({
  useInfrastructure: () => ({
    metrics: mockMetricsData,
    settings: mockSettingsData,
    setSettings: mockSetSettings,
    isLoadingMetrics: false,
    isRefreshing: false,
    isSavingSettings: false,
    isTestingWebhook: false,
    fetchMetrics: mockFetchMetrics,
    saveSettings: mockSaveSettings,
    testWebhook: mockTestWebhook,
  }),
}));

describe('Infrastructure Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título da página e as abas principais', () => {
    render(<Infrastructure />);
    expect(screen.getByText('Infraestrutura & Recursos do Servidor')).toBeInTheDocument();
    expect(screen.getByText(/Recursos do Servidor \(RAM & CPU\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Conexões & Banco \(PostgreSQL\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Configurações de Alertas \(Webhook\)/i)).toBeInTheDocument();
  });

  it('renderiza os dados de Hardware na aba padrão', () => {
    render(<Infrastructure />);
    expect(screen.getByText('Memória RAM (VPS)')).toBeInTheDocument();
    expect(screen.getByText('42.1%')).toBeInTheDocument();
    expect(screen.getByText('1.68 GB / 4 GB')).toBeInTheDocument();
    expect(screen.getByText('Processamento (CPU)')).toBeInTheDocument();
    expect(screen.getByText('12.4%')).toBeInTheDocument();
    expect(screen.getByText('2 vCPUs detectadas')).toBeInTheDocument();
  });

  it('alterna para a aba de Conexões e exibe métricas do banco', () => {
    render(<Infrastructure />);
    const dbTabButton = screen.getByText(/Conexões & Banco \(PostgreSQL\)/i);
    fireEvent.click(dbTabButton);

    expect(screen.getByText('Conexões em Uso Agora')).toBeInTheDocument();
    expect(screen.getByText('4 / 30')).toBeInTheDocument();
    expect(screen.getByText('Maior Pico Registrado Hoje')).toBeInTheDocument();
    expect(screen.getByText('8 conexões')).toBeInTheDocument();
    expect(screen.getByText('Capacidade do Servidor')).toBeInTheDocument();
    expect(screen.getByText('Histórico de Picos por Hora (Últimas 24h)')).toBeInTheDocument();
  });

  it('alterna para a aba de Configurações de Alertas e exibe formulário', () => {
    render(<Infrastructure />);
    const alertsTabButton = screen.getByText(/Configurações de Alertas \(Webhook\)/i);
    fireEvent.click(alertsTabButton);

    expect(screen.getByText('Disparo Automático de Alertas via Webhook')).toBeInTheDocument();
    expect(screen.getByText('Conexões de Banco')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Memória RAM (VPS)')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Processamento (CPU)')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText(/Testar Webhook/i)).toBeInTheDocument();
    expect(screen.getByText(/Salvar Configurações/i)).toBeInTheDocument();
  });

  it('chama fetchMetrics ao clicar no botão Atualizar', () => {
    render(<Infrastructure />);
    const refreshBtn = screen.getByRole('button', { name: /atualizar/i });
    fireEvent.click(refreshBtn);
    expect(mockFetchMetrics).toHaveBeenCalledWith(true);
  });
});
