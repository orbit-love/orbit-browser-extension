import { LitElement, html, css, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import orbitLogo from "bundle-text:../icons/orbit-logo.svg";

@customElement("obe-linkedin-button")
class LinkedinButton extends LitElement {
  static styles = [
    unsafeCSS(tailwindStylesheet),
    css`
      .orbit-logo {
        @apply relative left-[1px];
      }
    `,
  ];

  render() {
    return html`
      <div>
        <button
          type="button"
          class="w-[40px] h-[40px] text-[#00000099] hover:bg-[#00000014] rounded-full flex justify-center items-center"
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
