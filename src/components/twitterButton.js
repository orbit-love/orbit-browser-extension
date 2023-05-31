import { LitElement, html, unsafeCSS } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import orbitLogo from "bundle-text:../icons/orbit-logo.svg";

@customElement("obe-twitter-button")
class TwitterButton extends LitElement {
  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    return html`
      <div>
        <button
          type="button"
          class="min-w-[36px] min-h-[36px] mr-[8px] mb-[12px] text-[#0f1419] dark:text-[#eff3f4] hover:bg-[#0f14191A] rounded-full border border-[#cfd9de] dark:border-[#536471] flex justify-center items-center"
          id="menu-button"
          aria-haspopup="true"
        >
          <span class="sr-only">Open Orbit widget</span>
          <span aria-hidden="true">${unsafeSVG(orbitLogo)}</span>
        </button>
      </div>
    `;
  }
}
