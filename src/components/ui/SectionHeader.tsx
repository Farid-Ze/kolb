/**
 * KLSI 4.0 - SectionHeader Component
 * Task TODO3.md Phase 3: Section header untuk list dengan Title-Style Capitalization
 * 
 * Implementasi sesuai Guidelines.md §8.4.2:
 * - Tipografi dengan Title-Style Capitalization (bukan ALL-CAPS)
 * - Konsisten dengan konvensi sistem baru
 * - Spasi yang lega sesuai §8.4.1
 */

import React, { ReactNode } from 'react';
import { DynamicType } from './DynamicType';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  /** Section title text */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Optional action button */
  action?: ReactNode;
}

/**
 * SectionHeader Component
 * 
 * Guidelines.md §8.4.2: Tipografi (Kapitalisasi)
 * - Audit section header dalam list atau table
 * - Konvensi sistem tidak lagi merendernya sebagai huruf kapital semua (all-caps)
 * - Teks header harus menggunakan title-style capitalization
 *   (Huruf Besar di Awal Setiap Kata)
 * 
 * Guidelines.md §8.4.1: Layout & Spasi
 * - Komponen organisasi memiliki padding dan tinggi baris yang lebih besar
 * - Berikan ruang bernapas pada konten
 * 
 * @example
 * ```tsx
 * <SectionHeader>Recent Reports</SectionHeader>
 * <SectionHeader action={<Button>View All</Button>}>
 *   My Learning Styles
 * </SectionHeader>
 * ```
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  className,
  action,
}) => {
  return (
    <div
      className={cn(
        // Guidelines.md §8.4.1: Padding lebih besar untuk ruang bernapas
        'flex items-center justify-between',
        'py-3 px-4',
        'border-b border-border/50',
        className
      )}
    >
      <DynamicType
        as="h3"
        level="subheadline"
        weight="semibold"
        className="text-muted-foreground uppercase tracking-wider"
      >
        {children}
      </DynamicType>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};
