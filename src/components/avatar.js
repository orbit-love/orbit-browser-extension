import { LitElement, html, unsafeCSS, nothing } from "lit";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";

@customElement("obe-avatar")
class Avatar extends LitElement {
  static get properties() {
    return {
      avatarUrl: { attribute: "avatar-url", type: String },
      fallback: { type: String },
      isAvatarUrlValid: { state: true, type: Boolean },
    };
  }

  async connectedCallback() {
    super.connectedCallback();

    this.isAvatarUrlValid = await this.checkAvatarUrlValidity();
  }

  async checkAvatarUrlValidity() {
    if (!this.avatarUrl) {
      return false;
    }
    const response = await fetch(this.avatarUrl);
    return response.ok;
  }

  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    if (this.isAvatarUrlValid === undefined) {
      return nothing;
    }
    if (!this.isAvatarUrlValid) {
      return html`<div
        class="flex justify-center items-center w-14 h-14 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full"
      >
        <span class="text-xl font-bold text-white" role="img" alt=""
          >${this.fallback}</span
        >
      </div>`;
    } else {
      return html`<img
        alt=""
        class="w-14 h-14 rounded-full"
        src="${this.avatarUrl}"
      />`;
    }
  }
}
