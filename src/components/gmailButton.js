import { LitElement, html, css, unsafeCSS } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import orbitLogo from "bundle-text:../icons/orbit-logo.svg";

@customElement("obe-gmail-button")
class GmailButton extends LitElement {
  static styles = [
    unsafeCSS(tailwindStylesheet),
    // Gmail buttons "hover" effect is built with ::before attributes and CSS transitions
    // These properties have been copied from the other buttons
    css`
      button::before {
        content: "";
        display: block;
        opacity: 0;
        position: absolute;
        transition-duration: .15s;
        transition-timing-function: cubic-bezier(0.4,0,0.2,1);
        z-index: -1;
        bottom: -10px;
        left: -10px;
        right: -10px;
        top: -10px;
        background: none;
        border-radius: 50%;
        box-sizing: border-box;
        transform: scale(0);
        transition-property: transform,opacity;
      }

      button:hover::before {
        background-color: rgba(32, 33, 36, 0.059);
        border: none;
        box-shadow: none;
        opacity: 1;
        transform: scale(1);
      }
    `
  ];

  render() {
    return html`
      <div>
        <button
          type="button"
          class="relative top[-1px] z-0 w-[20px] h-[20px] ml-[20px] mb-[12px] text-[#454746] rounded-full flex justify-center items-center"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span class="sr-only">Open Orbit Widget</span>
          ${unsafeSVG(orbitLogo)}
        </button>
      </div>
    `;
  }
}
