import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { TailwindMixin } from "../utils/tailwindMixin";

import orbitLogo from 'bundle-text:../icons/orbit-logo.svg'

@customElement('obe-linkedin-button')
class LinkedinButton extends TailwindMixin(LitElement) {
  static styles = css`
    .orbit-logo {
      @apply relative left-[1px]
    }
  `

  render() {
    return html`
      <div>
        <button type="button" class="w-[40px] h-[40px] text-[#00000099] hover:bg-[#00000014] rounded-full flex justify-center items-center" id="menu-button" aria-expanded="true" aria-haspopup="true">
          <span class="sr-only">Open options</span>
          ${unsafeSVG(orbitLogo)}
        </button>
      </div>
    `
  }
}