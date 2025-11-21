import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KiteChart } from '../../components/report/KiteChart';

// Mock Recharts since it doesn't render well in JSDOM without specific setup
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    RadarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="radar-chart">{children}</div>
    ),
    PolarGrid: () => <div data-testid="polar-grid" />,
    PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
    Radar: () => <div data-testid="radar" />,
    Tooltip: () => <div data-testid="tooltip" />,
  };
});

describe('KiteChart', () => {
  const mockKiteData = {
    CE: 80,
    RO: 60,
    AC: 40,
    AE: 70,
  };

  it('renders nothing when kiteData is null', () => {
    const { container } = render(<KiteChart kiteData={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders chart title and description', () => {
    render(<KiteChart kiteData={mockKiteData} />);
    expect(screen.getByText('Profil Bentuk Layang-layang (Kite)')).toBeInTheDocument();
    expect(screen.getByText(/Visualisasi preferensi relatif Anda/)).toBeInTheDocument();
  });

  it('renders the chart components', () => {
    render(<KiteChart kiteData={mockKiteData} />);
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('polar-grid')).toBeInTheDocument();
    expect(screen.getByTestId('radar')).toBeInTheDocument();
  });

  it('renders the data values in the legend/table', () => {
    render(<KiteChart kiteData={mockKiteData} />);
    expect(screen.getByText('CE (Concrete Experience)')).toBeInTheDocument();
    expect(screen.getByText('80.0')).toBeInTheDocument();
    expect(screen.getByText('RO (Reflective Observation)')).toBeInTheDocument();
    expect(screen.getByText('60.0')).toBeInTheDocument();
    expect(screen.getByText('AC (Abstract Conceptualization)')).toBeInTheDocument();
    expect(screen.getByText('40.0')).toBeInTheDocument();
    expect(screen.getByText('AE (Active Experimentation)')).toBeInTheDocument();
    expect(screen.getByText('70.0')).toBeInTheDocument();
  });
});
