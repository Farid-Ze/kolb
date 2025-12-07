import "clsx";
import { W as WebGLCanvas, N as Navigation, H as HUD } from "../../../chunks/Navigation.js";
function _page($$renderer) {
  WebGLCanvas($$renderer, { mode: "INSIGHTS" });
  $$renderer.push(`<!----> `);
  Navigation($$renderer);
  $$renderer.push(`<!----> `);
  HUD($$renderer);
  $$renderer.push(`<!----> <main class="h-screen flex items-center justify-center pointer-events-none"><div class="text-center z-10 mix-blend-difference"><h1 class="typo-display text-white mb-4">PERSONAL INSIGHTS</h1> <p class="typo-mono text-neon-cyan">ADVANCED ANALYTICS DASHBOARD</p></div></main>`);
}
export {
  _page as default
};
