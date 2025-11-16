/**
 * KLSI 4.0 - DashboardLayout Component
 * Task 35: Layout untuk dashboard pages (HomePage, MediatorDashboard)
 * 
 * Implementasi sesuai frontend_blueprint.md §3.2:
 * - Full-width layout dengan optional sidebar
 * - LargeTitleHeader untuk navigation
 * - Content area dengan proper spacing
 */

import React, { ReactNode } from 'react';
import { LargeTitleHeader } from '../ui/LargeTitleHeader';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backLabel?: string;
  className?: string;
}

/**
 * DashboardLayout - Layout untuk halaman dashboard
 * 
 * Sesuai Guidelines.md §1.2 & frontend_blueprint.md §3.2
 * - Responsive grid layout
 * - Safe area compliance (§1.3.1)
 * - Large title header dengan collapse on scroll
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  showBackButton = false,
  backLabel = 'Kembali',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = showBackButton ? () => navigate(-1) : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LargeTitleHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        onBack={handleBack}
        backLabel={backLabel}
      />

      {/* Content Area */}
      <main className={`mx-auto max-w-7xl px-4 md:px-6 py-8 ${className}`.trim()}>
        {children}
      </main>
    </div>
  );
};
