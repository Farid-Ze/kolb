/**
 * KLSI 4.0 - NonDiagnosticNotice Component
 * Task 90: Banner "formatif, bukan seleksi"
 * 
 * Implementasi sesuai frontend_blueprint.md §4.2:
 * - Responsible use notice
 * - Prominent placement di reports dan assessment pages
 * - Clear messaging: formatif, bukan diagnostik klinis
 * 
 * UPDATED: Task TODO2.md Phase 4.8
 * - LongFormText dengan optimal line length (45-75ch)
 * - Left-aligned untuk readability (Guidelines.md §1.4.2)
 */

import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { LongFormText, DescriptionText } from '../ui/DynamicType';
import { cn } from '../ui/utils';

interface NonDiagnosticNoticeProps {
  variant?: 'default' | 'compact';
  className?: string;
  /** Optional override for the lead paragraph to display custom backend notice text */
  message?: string;
  id?: string;
}

const DEFAULT_NOTICE =
  'Kolb Learning Style Inventory (KLSI) 4.0 merupakan instrumen formatif untuk refleksi belajar terarah bersama fasilitator; tidak boleh dipakai sebagai alat seleksi, evaluasi kinerja, ataupun diagnostik klinis.';

/**
 * NonDiagnosticNotice - Banner responsible use
 * 
 * frontend_blueprint.md §4.2:
 * - "Instrumen formatif untuk refleksi belajar"
 * - "Bukan untuk seleksi atau diagnostik klinis"
 * - Prominent placement untuk mencegah misuse
 */
export const NonDiagnosticNotice: React.FC<NonDiagnosticNoticeProps> = ({
  variant = 'default',
  className = '',
  message,
  id,
}) => {
  const resolvedMessage = message?.trim() ? message.trim() : DEFAULT_NOTICE;

  if (variant === 'compact') {
    return (
      <div
        id={id}
        role="note"
        aria-label="Catatan penggunaan bertanggung jawab"
        className={cn(
          'rounded-xl border border-chart-3/40 bg-card text-foreground shadow-sm p-4 ring-1 ring-transparent focus-within:ring-chart-3/60 transition-shadow',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Catatan Penting:</strong>{' '}
              {resolvedMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert
      id={id}
      role="note"
      className={cn(
        'border border-chart-3/40 border-l-4 border-l-chart-3 bg-card text-foreground shadow-md',
        'ring-1 ring-transparent focus-within:ring-chart-3/50',
        className,
      )}
    >
      <AlertCircle className="h-5 w-5 text-chart-3" aria-hidden="true" />
      <AlertDescription className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-chart-3 mb-1">
            Penting
          </p>
          <h3 className="text-base text-foreground font-semibold mb-2">
            Penggunaan Bertanggung Jawab
          </h3>
          <LongFormText maxCharacters={70}>
            {resolvedMessage}
          </LongFormText>
        </div>

        <div className="space-y-2">
          <p className="text-foreground">
            <strong>LSI adalah:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>Alat untuk memahami preferensi belajar personal</li>
            <li>Titik awal untuk refleksi dan dialog</li>
            <li>Panduan untuk pengembangan kompetensi pembelajaran</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-foreground">
            <strong>LSI bukan:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>Tes kepribadian atau kecerdasan</li>
            <li>Instrumen diagnostik klinis</li>
            <li>Alat untuk seleksi atau penempatan kerja</li>
            <li>Prediktor kesuksesan akademik atau profesional</li>
          </ul>
        </div>

        {/* Provenance */}
        <div className="pt-4 mt-4">
          <DescriptionText maxCharacters={75}>
            Hasil KLSI idealnya diinterpretasikan bersama fasilitator terlatih agar konteks
            pengembangan pembelajaran tetap proporsional dan tidak dipakai sebagai diagnosis permanen.
          </DescriptionText>
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * ResponsibleUseFooter - Footer singkat untuk placement di bawah reports
 */
export const ResponsibleUseFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      role="note"
      className={cn(
        'rounded-lg border border-border/60 bg-card text-center py-4 px-4 shadow-sm',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground leading-relaxed">
        💡 <strong>Gunakan secara formatif:</strong> KLSI membantu refleksi belajar dan dialog
        pembelajaran; hindari memakainya untuk seleksi, diagnosis klinis, atau penilaian performa.
      </p>
    </div>
  );
};