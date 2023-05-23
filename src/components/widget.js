import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { TailwindMixin } from "../utils/tailwindMixin";
import { getOrbitCredentials } from "../oauth-helpers";

class Widget extends TailwindMixin(LitElement) {
  //   @queryAssignedElements({ slot: "additional-data" })
  // _additionalDataSlots!;

  static get properties() {
    return {
      isOpen: { type: Boolean, state: true },
      username: { type: String },
      platform: { type: String },
    };
  }

  constructor() {
    super();
    this.isOpen = false;
    this.isLoading = false;
    this.hasAuthError = false;
    this.hasError = false;

    this.isAMember = false;

    this.member = {};

    this.workspace = {};
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
        <div class="py-1" role="none">${this.getTemplateContent()}</div>
      </div>
    `;
  }

  getTemplateContent() {
    // TODO: check if member present, use generic error as default state instead?
    // TODO: this.isAMember state
    if (this.isLoading) return this.textTemplate("Loading Orbit data…");
    if (this.hasAuthError) return this.authErrorTemplate();
    if (this.hasError)
      return this.textTemplate("There was an error fetching Orbit data.");

    return this.memberTemplate();
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

  memberTemplate() {
    return html`
      <div class="px-4 truncate" role="menuitem">
        <!-- Name -->
        <span
          class="block pt-1 text-sm text-xl font-bold text-gray-900 truncate"
          >${this.member.name}</span
        >
        <!-- Title -->
        <span class="block text-sm text-gray-500 truncate"
          >${this.member.jobTitle}</span
        >
        <!-- Organization -->
        ${this.member.organization}
      </div>
    `;
  }

  _toggle() {
    this.isOpen = !this.isOpen;
  }

  async _loadOrbitData() {
    if (!this.isLoading && !this.hasLoaded) {
      this.isLoading = true;

      const ORBIT_CREDENTIALS = await getOrbitCredentials();

      const response = await chrome.runtime.sendMessage({
        operation: "LOAD_MEMBER_DATA",
        username: this.username,
        platform: this.platform,
        ORBIT_CREDENTIALS,
      });

      const { status, success } = response;

      this.workspace = ORBIT_CREDENTIALS.WORKSPACE;

      if (status === 401) {
        this.hasAuthError = true;
      } else if (status === 404) {
        this.isAMember = false;
      } else if (success === false) {
        this.hasError = true;
      } else {
        this.isAMember = true;

        const { data, included } = response.response;

        if (!data) {
          this.isAMember = false;

          this.hasError = true;
          this.isLoading = false;
          this.requestUpdate();
          return;
        }

        const identities = data.relationships.identities.data.map(
          ({ id, type }) =>
            included.find(
              ({ id: included_id, type: included_type }) =>
                id === included_id && type === included_type
            )?.attributes
        );

        const organizations = data.relationships.organizations.data.map(
          ({ id, type }) =>
            included.find(
              ({ id: included_id, type: included_type }) =>
                id === included_id && type === included_type
            )?.attributes
        );

        const organization = organizations[0] || null;

        this.member = {
          name: data.attributes.name,
          jobTitle: data.attributes.title,
          slug: data.attributes.slug,
          teammate: data.attributes.teammate,
          orbitLevel: data.attributes.orbit_level,
          organization: organization,
          lastActivityOccurredAt: data.attributes.last_activity_occurred_at,
          tags: data.attributes.tags,
          identities: identities,
        };
      }

      this.isLoading = false;
      this.requestUpdate();

      // this._additionalDataSlots[0].additionalData = additionalData;
    }
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
