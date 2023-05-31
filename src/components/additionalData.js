import { LitElement, html, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import { getIconPath } from "../helpers/widget-helper";

@customElement("obe-additional-data")
class additionalData extends LitElement {
  static get properties() {
    return {
      platform: { type: String },
      value: { type: String },
    };
  }

  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    return html`
      <div class="flex gap-2 items-center">
        <img
          class="w-7 h-7"
          alt=""
          src="${chrome.runtime.getURL(getIconPath(this.platform))}"
        />
        <span class="text-sm text-gray-900">${this.value}</span>
      </div>
    `;
  }
}
