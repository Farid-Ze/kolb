import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { useUIPreferences } from '../../contexts/UIPreferencesContext';
import { GuideModal } from './GuideModal';
import { GUIDE_IDS } from '../../services/guideService';
import { VibrantText } from '../ui/VibrantText';

export const TelemetryConsentBanner: React.FC = () => {
  const { telemetryEnabled, setTelemetryEnabled } = useUIPreferences();
  const [showGuide, setShowGuide] = useState(false);

  if (telemetryEnabled) {
    return null;
  }

  return (
    <>
      <GuideModal
        guideId={GUIDE_IDS.EDUCATOR_RESPONSIBLE_USE}
        title="Pemakaian Bertanggung Jawab"
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        context="telemetry_consent_banner"
      />
      <div className="material-regular rounded-xl border border-border p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-chart-3/15 p-2 text-chart-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <VibrantText hierarchy="primary" as="p">
              Telemetry Opsional untuk Penggunaan yang Bertanggung Jawab
            </VibrantText>
            <p className="text-sm text-muted-foreground">
              Kami hanya mengirim data agregat (tanpa identitas) untuk memastikan pedoman
              {" "}
              <span className="font-semibold">educator_responsible_use</span> dipenuhi dan
              fitur laporan berjalan stabil. Anda dapat mengubah pilihan kapan saja.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setTelemetryEnabled(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:opacity-90"
          >
            Izinkan Telemetry
          </button>
          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 transition-spring hover:opacity-90"
          >
            <Info className="h-4 w-4" />
            Pelajari Pedoman
          </button>
        </div>
      </div>
    </>
  );
};
