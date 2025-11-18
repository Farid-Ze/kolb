/**
 * KLSI 4.0 - BalanceScoresCard Component
 * Task 95: Tampilkan BAL_ACCE & BAL_AERO dengan BalanceDisclaimer
 * 
 * Implementasi sesuai:
 * - psychometrics_spec.md §2.1: Balance Scores (BAL_ACCE, BAL_AERO)
 * - frontend_blueprint.md §4.2: Balance interpretation disclaimer
 */

import React from 'react';
import { Info, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Alert, AlertDescription } from '../ui/alert';

interface BalanceScoresCardProps {
  balACCE: number;
  balAERO: number;
  className?: string;
}

/**
 * BalanceScoresCard - Visualisasi Balance Scores
 * 
 * psychometrics_spec.md §2.1:
 * - BAL_ACCE = |ACCE - 9|
 * - BAL_AERO = |AERO - 6|
 * 
 * Skor yang lebih rendah = lebih "balanced"
 * Skor yang lebih tinggi = lebih "specialized"
 */
export const BalanceScoresCard: React.FC<BalanceScoresCardProps> = ({
  balACCE,
  balAERO,
  className = '',
}) => {
  // Interpretasi balance scores (lower = more balanced)
  const getBalanceLevel = (score: number): 'balanced' | 'moderate' | 'specialized' => {
    if (score <= 3) return 'balanced';
    if (score <= 7) return 'moderate';
    return 'specialized';
  };

  const getBalanceIcon = (score: number) => {
    const level = getBalanceLevel(score);
    if (level === 'balanced') return <Minus className="h-5 w-5 text-success" />;
    if (level === 'moderate') return <TrendingUp className="h-5 w-5 text-warning" />;
    return <TrendingUp className="h-5 w-5 text-chart-1" />;
  };

  const getBalanceLabel = (score: number): string => {
    const level = getBalanceLevel(score);
    if (level === 'balanced') return 'Balanced';
    if (level === 'moderate') return 'Moderately Balanced';
    return 'Specialized';
  };

  const getBalanceDescription = (dimension: 'ACCE' | 'AERO', score: number): string => {
    const level = getBalanceLevel(score);
    
    if (dimension === 'ACCE') {
      if (level === 'balanced') {
        return 'Preferensi yang seimbang antara pembelajaran Abstract (AC) dan Concrete (CE)';
      }
      if (level === 'moderate') {
        return 'Cenderung ke salah satu sisi (AC atau CE) namun masih fleksibel';
      }
      return 'Preferensi yang jelas dan konsisten terhadap AC atau CE';
    } else {
      if (level === 'balanced') {
        return 'Preferensi yang seimbang antara pembelajaran Active (AE) dan Reflective (RO)';
      }
      if (level === 'moderate') {
        return 'Cenderung ke salah satu sisi (AE atau RO) namun masih fleksibel';
      }
      return 'Preferensi yang jelas dan konsisten terhadap AE atau RO';
    }
  };

  return (
    <Card className={`material-regular ${className}`.trim()}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-chart-2" />
          Balance Scores
        </CardTitle>
        <CardDescription>
          Ukuran keseimbangan preferensi di antara dimensi dialektik
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BAL_ACCE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {getBalanceIcon(balACCE)}
                <span className="text-foreground">
                  Balance AC-CE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Abstract vs Concrete
              </p>
            </div>
            <div className="text-right">
              <div className="text-foreground">
                {balACCE.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getBalanceLabel(balACCE)}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {getBalanceDescription('ACCE', balACCE)}
          </p>
        </div>

        {/* BAL_AERO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {getBalanceIcon(balAERO)}
                <span className="text-foreground">
                  Balance AE-RO
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active vs Reflective
              </p>
            </div>
            <div className="text-right">
              <div className="text-foreground">
                {balAERO.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getBalanceLabel(balAERO)}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {getBalanceDescription('AERO', balAERO)}
          </p>
        </div>

        {/* Balance Disclaimer (frontend_blueprint.md §4.2) */}
        <Alert className="border-l-4 border-l-chart-3">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-2">
            <p>
              <strong className="text-foreground">Tentang Balance Scores:</strong>
            </p>
            <p className="text-muted-foreground">
              Skor balance yang lebih <strong>rendah</strong> menunjukkan preferensi yang lebih 
              seimbang antara kedua mode dalam dimensi tersebut. Skor yang lebih <strong>tinggi</strong> 
              menunjukkan preferensi yang lebih spesialisasi/konsisten.
            </p>
            <p className="text-muted-foreground">
              Tidak ada skor yang "lebih baik" - keduanya memiliki kekuatan dan konteks yang tepat 
              untuk efektivitas pembelajaran.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
