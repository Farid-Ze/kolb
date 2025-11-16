import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * KLSI 4.0 - NotFoundPage (404)
 * Task 11: NotFoundPage
 * 
 * FIXED: Removed text-* classes, added Motion springs
 * Implementasi sesuai Guidelines.md Section 1.4.3, 2.3.1
 */

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-regular rounded-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Error Code */}
        <div className="space-y-2">
          {/* FIXED §3.4.2: Large decorative text, bukan interaktif */}
          <h1 className="text-foreground opacity-20">404</h1>
          <h2 className="text-foreground">
            Halaman Tidak Ditemukan
          </h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <motion.button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
          >
            <Home className="h-4 w-4" />
            Ke Beranda
          </motion.button>
        </div>

        {/* Decorative element */}
        <div className="pt-6 opacity-50">
          <div className="skeleton h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};