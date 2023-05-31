import { LitElement, html, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";

import { ORBIT_API_ROOT_URL } from "../constants";

@customElement("obe-tag")
class Tag extends LitElement {
  static get properties() {
    return {
      tag: { type: String },
      workspace: { type: String },
    };
  }

  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    return html`
      <a
        href="${ORBIT_API_ROOT_URL}/${this
          .workspace}/members?tags_contains_any_of[]=${this.tag}"
        title="View all members tagged ${this.tag} in Orbit"
        target="_blank"
        rel="noreferrer"
      >
        <span
          class="inline-flex items-center py-1 px-1.5 text-sm text-purple-900 bg-purple-100 rounded-md"
          >${this.tag}</span
        >
      </a>
    `;
  }
}
