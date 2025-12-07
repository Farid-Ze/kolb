import "clsx";
import "../../chunks/Navigation.svelte_svelte_type_style_lang.js";
import { x as attr_style, y as stringify } from "../../chunks/index2.js";
import { e as escape_html } from "../../chunks/context.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger.js";
function LoadingScreen($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let progress = 0;
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading-screen svelte-1ne9ekp"><div class="loader-content svelte-1ne9ekp"><div class="logo typo-display svelte-1ne9ekp">ZENOTIKA</div> <div class="progress-bar svelte-1ne9ekp"><div class="fill svelte-1ne9ekp"${attr_style(`width: ${stringify(progress)}%`)}></div></div> <div class="status typo-mono svelte-1ne9ekp">INITIALIZING NEURAL INTERFACE... ${escape_html(Math.floor(progress))}%</div></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    LoadingScreen($$renderer2);
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
