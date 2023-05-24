import { LitElement, html } from "lit";
import { TailwindMixin } from "../utils/tailwindMixin";

import { ORBIT_API_ROOT_URL } from "../constants";

class Tag extends TailwindMixin(LitElement) {
  static get properties() {
    return {
      tag: { type: String },
      workspace: { type: String },
    };
  }

  render() {
    return html`
      <a
        href="${ORBIT_API_ROOT_URL}/${this
          .workspace}/members/tags_contains_any_of[]=${this.tag}"
        title="View all members tagged ${this.tag} in Orbit"
        target="_blank"
        rel="noreferrer"
      >
        <span
          class="ring-purple-700/10 inline-flex items-center py-0.5 px-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-md ring-1 ring-inset"
          >${this.tag}</span
        >
      </a>
    `;
  }
}

customElements.define("obe-tag", Tag);
