import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { TailwindMixin } from "../utils/tailwindMixin";

class Widget extends TailwindMixin(LitElement) {
  static get properties() {
    return {
      isOpen: { type: Boolean, state: true },
    };
  }

  constructor() {
    super();
    this.isOpen = false;
    this.isLoading = false;
    this.hasAuthError = false;
    this.hasError = false;
  }

  connectedCallback() {
    super.connectedCallback();

    // Used to detect clicks outside of the widget & collapse it
    // https://lamplightdev.com/blog/2021/04/10/how-to-detect-clicks-outside-of-a-web-component/
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
        <div class="py-1" role="none">
          ${this.isLoading ? this.textTemplate("Loading Orbit data…") : nothing}
          ${this.hasAuthError ? this.authErrorTemplate() : nothing}
          ${this.hasError
            ? this.textTemplate("There was an error fetching Orbit data.")
            : nothing}
          Widget contents
        </div>
      </div>
    `;
  }

  textTemplate(text) {
    return html`
      <span
        class="block py-1 px-4 text-sm text-gray-500 truncate"
        role="menuitem"
        >${text}</span
      >
    `;
  }

  authErrorTemplate() {
    return html`
      <span
        class="block py-1 px-4 text-sm text-gray-500 truncate"
        role="menuitem"
        >Authentication error: API token or workspace is missing or
        invalid</span
      >
      <span
        @click=${() => chrome.runtime.sendMessage("showOptions")}
        class="block py-1 px-4 text-sm text-gray-500 cursor-pointer"
        role="menuitem"
        >Click here or on the extension icon to authenticate.</span
      >
    `;
  }

  _toggle() {
    this.isOpen = !this.isOpen;
  }

  async _loadOrbitData() {
    console.log("#_loadOrbitData");
  }

  static get styles() {
    return css`
      :not(:defined) {
        display: none;
      }
      * {
        @apply font-sans;
      }
    `;
  }

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

customElements.define("obe-widget", Widget);
