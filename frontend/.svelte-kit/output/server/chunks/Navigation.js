import "clsx";
import { a as ssr_context, e as escape_html } from "./context.js";
import "./Navigation.svelte_svelte_type_style_lang.js";
import { x as attr_style, y as stringify, G as attr_class } from "./index2.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./state.svelte.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function WebGLCanvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { mode = "LANDING" } = $$props;
    onDestroy(() => {
    });
    $$renderer2.push(`<canvas class="webgl-canvas svelte-dgr3na"></canvas>`);
  });
}
function HUD($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let velocity = 0;
    let progress = 0;
    let mode = "CALM";
    let section = "HERO";
    $$renderer2.push(`<div class="hud-container svelte-se4dbo"><div class="hud-top-left svelte-se4dbo"><div class="typo-hud text-xs text-gray-500 svelte-se4dbo">SYSTEM STATUS</div> <div class="typo-data text-xl svelte-se4dbo">${escape_html(mode)}</div> <div class="typo-hud text-xs text-gray-500 mt-2 svelte-se4dbo">SECTOR</div> <div class="typo-data text-lg text-neon-cyan">${escape_html(section)}</div></div> <div class="hud-bottom-left svelte-se4dbo"><div class="typo-hud text-xs text-gray-500 svelte-se4dbo">VELOCITY</div> <div class="typo-data text-xl svelte-se4dbo">${escape_html(Math.round(velocity))} px/s</div> <div class="velocity-bar svelte-se4dbo"><div class="velocity-fill svelte-se4dbo"${attr_style(`width: ${stringify(Math.min(velocity / 10, 100))}%`)}></div></div></div> <div class="hud-bottom-right svelte-se4dbo"><div class="typo-hud text-xs text-gray-500 svelte-se4dbo">PROGRESS</div> <div class="typo-data text-xl svelte-se4dbo">${escape_html(Math.round(progress * 100))}%</div></div></div>`);
  });
}
function Navigation($$renderer) {
  let isMuted = false;
  $$renderer.push(`<header class="header fixed top-0 left-0 w-full p-10 z-50 flex justify-between items-start pointer-events-none mix-blend-difference svelte-n7qjfl"><div class="header__brand flex flex-col gap-1 pointer-events-auto svelte-n7qjfl"><span class="typo-label text-[11px] tracking-[0.1em] text-white/70 uppercase svelte-n7qjfl">ZENOTIKA</span> <span class="typo-label text-[11px] tracking-[0.1em] text-white/70 uppercase hidden md:block svelte-n7qjfl">× UNIKOM</span></div> <div class="header__controls flex items-center gap-6 pointer-events-auto svelte-n7qjfl"><button class="header__sound flex items-center gap-2 cursor-pointer group bg-transparent border-none p-0 svelte-n7qjfl"><div${attr_class("header__sound-wave flex items-end gap-[2px] h-3 svelte-n7qjfl", void 0, { "muted": isMuted })}><div class="bar w-[2px] bg-white/80 rounded-[1px] svelte-n7qjfl"></div> <div class="bar w-[2px] bg-white/80 rounded-[1px] svelte-n7qjfl"></div> <div class="bar w-[2px] bg-white/80 rounded-[1px] svelte-n7qjfl"></div> <div class="bar w-[2px] bg-white/80 rounded-[1px] svelte-n7qjfl"></div></div> <span class="header__sound-label typo-label text-[11px] tracking-[0.15em] text-white/70 uppercase hidden md:block group-hover:text-white transition-colors svelte-n7qjfl">SOUND</span></button> <button class="header__hamburger flex items-center gap-[6px] cursor-pointer bg-transparent border-none p-0 group svelte-n7qjfl" aria-label="Menu"><div class="dot w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors svelte-n7qjfl"></div> <div class="dot w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors svelte-n7qjfl"></div> <div class="dot w-1 h-1 rounded-full bg-white/70 group-hover:bg-white transition-colors svelte-n7qjfl"></div></button></div></header>`);
}
export {
  HUD as H,
  Navigation as N,
  WebGLCanvas as W
};
