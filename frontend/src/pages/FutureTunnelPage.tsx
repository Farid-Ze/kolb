import { FutureTunnelExperience } from '../features/future-tunnel/components/FutureTunnelExperience'
import { Tunnel3DBackground } from '../features/future-tunnel/components/Tunnel3DBackground'

export function FutureTunnelPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Immersive 3D Warp Tunnel Background */}
      <div className="fixed inset-0 z-0">
        <Tunnel3DBackground />
      </div>
      
      {/* Gradient Overlay for Readability */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-zenotika-bg/80 via-zenotika-bg/60 to-zenotika-bg/80 pointer-events-none" />
      
      {/* Content Layer */}
      <section className="relative z-10 mx-auto min-h-screen max-w-5xl px-4 py-10">
        <FutureTunnelExperience />
      </section>
    </div>
  )
}
