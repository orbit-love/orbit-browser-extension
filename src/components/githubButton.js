import { LitElement, html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";
import { TailwindMixin } from "../utils/tailwindMixin";

import orbitLogo from "bundle-text:../icons/orbit-logo.svg";

@customElement("obe-github-button")
class GitHubButton extends TailwindMixin(LitElement) {
  render() {
    return html`
      <div>
        <button
          type="button"
          class="inline-block px-[8px] py-[4px] text-[#656d76] hover:text-[#6c4df6]"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span class="sr-only">Open Orbit widget</span>
          ${unsafeSVG(orbitLogo)}
        </button>
      </div>
    `;
  }
}
