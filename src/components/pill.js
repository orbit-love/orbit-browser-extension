import { LitElement, html, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";

@customElement("obe-pill")
class Pill extends LitElement {
  static get properties() {
    return {
      icon: { type: String },
      name: { type: String },
      value: { type: String },
    };
  }

  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    return html`
      <div
        class="ring-gray-500/10 inline-flex items-center py-0.5 px-1 bg-gray-50 rounded-full ring-1 ring-inset"
      >
        ${this.icon &&
        html`<span class="mr-1 w-4 text-gray-700"
          >${unsafeSVG(this.icon)}</span
        >`}
        ${this.name &&
        html`<span class="mr-1.5 font-medium text-gray-600"
          >${this.name}</span
        >`}
        <span class="font-semibold text-gray-700">${this.value}</span>
      </div>
    `;
  }
}
