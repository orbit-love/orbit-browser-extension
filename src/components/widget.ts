import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { TailwindMixin } from "../utils/tailwindMixin";
@customElement("obe-widget")
class Widget extends TailwindMixin(LitElement) {
  @state() isOpen = false;

  connectedCallback(): void {
    super.connectedCallback();

    // Close the widget when clicking outside.
    // See https://lamplightdev.com/blog/2021/04/10/how-to-detect-clicks-outside-of-a-web-component/
    // for an explanation about `event.composedPath`
    document.addEventListener("click", (event) => {
      if (this.isOpen && !event.composedPath().includes(this)) {
        this.isOpen = false;
      }
    });
  }

  dropdownTemplate() {
    return html`
      <div
        class="obe-dropdown ring-opacity-5 absolute right-0 z-10 mt-2 bg-white rounded-md ring-1 ring-black shadow-lg origin-top-right focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        aria-hidden="${!this.isOpen}"
        tabindex="-1"
        style="visibility: ${this.isOpen ? "visible" : "hidden"}"
      >
        <div class="py-1" role="none">Widget contents</div>
      </div>
    `;
  }

  private _toggle() {
    this.isOpen = !this.isOpen;
  }

  private async _loadOrbitData() {
    console.log("#_loadOrbitData");
  }

  static styles = css`
    :not(:defined) {
      display: none;
    }
    * {
      @apply font-sans;
    }
  `;

  render() {
    return html`
      <div class="inline-block relative font-sans text-left">
        <slot
          name="button"
          @click="${this._toggle}"
          @mouseover="${this._loadOrbitData}"
        ></slot>
        ${this.dropdownTemplate()}
      </div>
    `;
  }
}
