import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg';
import { TailwindMixin } from "../utils/tailwindMixin";

import orbitLogo from 'bundle-text:../icons/orbit-logo.svg'

@customElement('obe-twitter-button')
class TwitterButton extends TailwindMixin(LitElement) {
  render() {
    return html`
      <div>
        <button type="button" class="min-w-[36px] min-h-[36px] mr-[8px] mb-[12px] text-[#0f1419] hover:bg-[#0f14191A] rounded-full border border-[#cfd9de] flex justify-center items-center" id="menu-button" aria-expanded="true" aria-haspopup="true">
          <span class="sr-only">Open options</span>
          ${unsafeSVG(orbitLogo)}
        </button>
      </div>
    `
  }
}