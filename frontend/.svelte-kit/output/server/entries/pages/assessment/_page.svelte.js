import { z as derived, F as ensure_array_like, G as attr_class, y as stringify, J as attr } from "../../../chunks/index2.js";
import { W as WebGLCanvas, N as Navigation, H as HUD } from "../../../chunks/Navigation.js";
import { e as escape_html } from "../../../chunks/context.js";
const MOCK_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  id: `item-${i + 1}`,
  prompt: `When I learn... (Item ${i + 1})`,
  options: [
    { id: `opt-${i}-ce`, text: "I like to deal with my feelings", code: "CE" },
    { id: `opt-${i}-ro`, text: "I like to watch and listen", code: "RO" },
    { id: `opt-${i}-ac`, text: "I like to think about ideas", code: "AC" },
    { id: `opt-${i}-ae`, text: "I like to be doing things", code: "AE" }
  ]
}));
class KolbAPI {
  token = null;
  setToken(token) {
    this.token = token;
  }
  clearToken() {
    this.token = null;
  }
  async request(endpoint, options = {}) {
    return this.mockRequest(endpoint, options);
  }
  async mockRequest(endpoint, options) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (endpoint === "/sessions" && options.method === "POST") {
      return {
        id: "mock-session-id",
        status: "started",
        instrument_code: "KLSI",
        instrument_version: "4.0",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        completed_at: null,
        pipeline_version: "mock"
      };
    }
    if (endpoint.includes("/delivery")) {
      return MOCK_ITEMS;
    }
    if (endpoint.includes("/submit")) {
      return {};
    }
    if (endpoint.includes("/finalize")) {
      return { status: "completed" };
    }
    if (endpoint.includes("/scores")) {
      return {
        session_id: "mock-session-id",
        scale_scores: { CE: 30, RO: 25, AC: 35, AE: 30 },
        combination_scores: { ACCE: 5, AERO: 5, balance_acce: 0, balance_aero: 0 },
        learning_style: {
          primary_style: "Balancing",
          style_code: "B",
          intensity: { level: "moderate", magnitude: 0.5 }
        },
        lfi: { score: 0.6, w_coefficient: 0.7, interpretation: "High Flexibility" }
      };
    }
    throw new Error(`Mock endpoint not found: ${endpoint}`);
  }
  async createSession(data) {
    return this.request("/sessions", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async getDeliveryPackage(sessionId, locale = "id") {
    return this.request(`/sessions/${sessionId}/delivery?locale=${locale}`);
  }
  async submitResponse(sessionId, submission) {
    return this.request(`/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify(submission)
    });
  }
  async finalizeSession(sessionId) {
    return this.request(`/sessions/${sessionId}/finalize`, {
      method: "POST"
    });
  }
  async getScores(sessionId) {
    return this.request(`/sessions/${sessionId}/scores`);
  }
}
const kolbAPI = new KolbAPI();
class AssessmentStore {
  session = null;
  items = [];
  currentIndex = 0;
  scores = null;
  isLoading = false;
  error = null;
  #currentItem = derived(() => this.items[this.currentIndex]);
  get currentItem() {
    return this.#currentItem();
  }
  set currentItem($$value) {
    return this.#currentItem($$value);
  }
  #progress = derived(() => this.items.length > 0 ? this.currentIndex / this.items.length : 0);
  get progress() {
    return this.#progress();
  }
  set progress($$value) {
    return this.#progress($$value);
  }
  #canFinalize = derived(() => this.items.length > 0 && this.currentIndex >= this.items.length);
  get canFinalize() {
    return this.#canFinalize();
  }
  set canFinalize($$value) {
    return this.#canFinalize($$value);
  }
  async startSession(instrumentCode = "KLSI") {
    this.isLoading = true;
    this.error = null;
    try {
      this.session = await kolbAPI.createSession({ instrument_code: instrumentCode });
      this.items = await kolbAPI.getDeliveryPackage(this.session.id);
      this.currentIndex = 0;
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isLoading = false;
    }
  }
  async submitResponse(rankings, responseTimeMs) {
    if (!this.session || !this.currentItem) return;
    this.isLoading = true;
    try {
      const submission = {
        item_id: this.currentItem.id,
        rankings,
        response_time_ms: responseTimeMs
      };
      await kolbAPI.submitResponse(this.session.id, submission);
      this.currentIndex++;
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isLoading = false;
    }
  }
  async finalize() {
    if (!this.session) return;
    this.isLoading = true;
    try {
      await kolbAPI.finalizeSession(this.session.id);
      this.scores = await kolbAPI.getScores(this.session.id);
      return this.scores;
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isLoading = false;
    }
  }
  reset() {
    this.session = null;
    this.items = [];
    this.currentIndex = 0;
    this.scores = null;
    this.error = null;
  }
}
const assessmentStore = new AssessmentStore();
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let rankings = [];
    function getRank(optionId) {
      const r = rankings.find((r2) => r2.id === optionId);
      return r ? r.rank : null;
    }
    WebGLCanvas($$renderer2, { mode: "ASSESSMENT" });
    $$renderer2.push(`<!----> `);
    Navigation($$renderer2);
    $$renderer2.push(`<!----> `);
    HUD($$renderer2);
    $$renderer2.push(`<!----> <main class="assessment-page svelte-5rx2mz">`);
    if (assessmentStore.isLoading && !assessmentStore.currentItem) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading typo-mono svelte-5rx2mz">INITIALIZING ASSESSMENT PROTOCOL...</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (assessmentStore.scores) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="results-container svelte-5rx2mz"><h1 class="typo-display text-white mb-4">ANALYSIS COMPLETE</h1> <div class="score-card"><div class="typo-label text-neon-cyan mb-2">PRIMARY STYLE</div> <div class="typo-headline text-white mb-8">${escape_html(assessmentStore.scores.learning_style.primary_style)}</div> <div class="grid grid-cols-2 gap-8 mb-8"><div><div class="typo-hud text-gray-500">LFI SCORE</div> <div class="typo-data text-xl">${escape_html(assessmentStore.scores.lfi.score)}</div></div> <div><div class="typo-hud text-gray-500">FLEXIBILITY</div> <div class="typo-data text-xl">${escape_html(assessmentStore.scores.lfi.interpretation)}</div></div></div> <a href="/" class="btn-primary svelte-5rx2mz">RETURN TO HUB</a></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (assessmentStore.currentItem) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="question-container svelte-5rx2mz"><div class="progress-indicator typo-hud mb-8 svelte-5rx2mz">ITEM ${escape_html(assessmentStore.currentIndex + 1)} / ${escape_html(assessmentStore.items.length)}</div> <h2 class="prompt typo-headline text-white mb-12">${escape_html(assessmentStore.currentItem.prompt)}</h2> <div class="options-grid svelte-5rx2mz"><!--[-->`);
          const each_array = ensure_array_like(assessmentStore.currentItem.options);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let option = each_array[$$index];
            $$renderer2.push(`<button${attr_class(`option-card ${stringify(getRank(option.id) ? "selected" : "")}`, "svelte-5rx2mz")}><div class="rank-indicator typo-mono svelte-5rx2mz">${escape_html(getRank(option.id) ?? "")}</div> <span class="text typo-body svelte-5rx2mz">${escape_html(option.text)}</span></button>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="actions mt-12"><button${attr_class(`btn-next ${stringify(rankings.length === 4 ? "active" : "")}`, "svelte-5rx2mz")}${attr("disabled", rankings.length !== 4, true)}>CONFIRM SELECTION</button></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};
