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

interface NonDiagnosticNoticeProps {
  variant?: 'default' | 'compact';
  className?: string;
}

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
}) => {
  if (variant === 'compact') {
    return (
      <div className={`material-thin rounded-xl p-4 border-l-4 border-l-chart-3 ${className}`.trim()}>
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Catatan Penting:</strong>{' '}
              Instrumen formatif untuk refleksi belajar, bukan untuk seleksi atau diagnostik klinis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert className={`border-l-4 border-l-chart-3 ${className}`.trim()}>
      <AlertCircle className="h-5 w-5" />
      <AlertDescription className="space-y-3">
        <div>
          <p className="text-foreground mb-2">
            <strong>Penting: Penggunaan yang Bertanggung Jawab</strong>
          </p>
          <LongFormText maxCharacters={70}>
            Learning Style Inventory (LSI) adalah instrumen <strong>formatif</strong> yang dirancang 
            untuk memfasilitasi refleksi dan pengembangan diri dalam konteks pembelajaran. 
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
            Hasil LSI sebaiknya diinterpretasikan bersama dengan fasilitator yang terlatih 
            dalam konteks pengembangan pembelajaran yang tepat.
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
    <div className={`text-center py-4 ${className}`.trim()}>
      <p className="text-xs text-muted-foreground">
        💡 <strong>Catatan:</strong> KLSI adalah instrumen formatif untuk refleksi belajar, 
        bukan untuk seleksi atau diagnostik klinis.
      </p>
    </div>
  );
};