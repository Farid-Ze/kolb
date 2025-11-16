/**
 * KLSI 4.0 - ReportsLayout Component
 * Task 36: Layout untuk halaman reports
 * 
 * Implementasi sesuai frontend_blueprint.md §3.2:
 * - Clean reading layout
 * - Print-friendly design
 * - Proper content hierarchy
 */

import React, { ReactNode } from 'react';
import { LargeTitleHeader } from '../ui/LargeTitleHeader';
import { Button } from '../ui/button';
import { Printer, Download, Share2 } from 'lucide-react';

interface ReportsLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showPrintButton?: boolean;
  showDownloadButton?: boolean;
  showShareButton?: boolean;
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onBack?: () => void;
  className?: string;
}

/**
 * ReportsLayout - Layout untuk report pages
 * 
 * Sesuai Guidelines.md & frontend_blueprint.md §3.2
 * - Optimized untuk reading & printing
 * - Action buttons untuk Print/Download/Share
 * - Proper content max-width untuk readability (§1.4.3)
 */
export const ReportsLayout: React.FC<ReportsLayoutProps> = ({
  children,
  title,
  subtitle,
  showPrintButton = true,
  showDownloadButton = false,
  showShareButton = false,
  onPrint,
  onDownload,
  onShare,
  onBack,
  className = '',
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      {showPrintButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Cetak</span>
        </Button>
      )}
      {showDownloadButton && onDownload && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>
      )}
      {showShareButton && onShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Bagikan</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LargeTitleHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        onBack={onBack}
        backLabel="Kembali"
      />

      {/* Content Area - Optimized for reading */}
      <main 
        className={`mx-auto max-w-4xl px-4 md:px-6 py-8 ${className}`.trim()}
        id="report-content"
      >
        {children}
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide UI chrome when printing */
          header, .no-print {
            display: none !important;
          }
          
          /* Optimize for print */
          #report-content {
            max-width: 100%;
            padding: 0;
          }
          
          /* Force light mode colors for print */
          body {
            background: white;
            color: black;
          }
        }
      `}</style>
    </div>
  );
};
