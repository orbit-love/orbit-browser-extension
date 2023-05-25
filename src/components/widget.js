import { LitElement, html, css, nothing } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { TailwindMixin } from "../utils/tailwindMixin";
import { configureRequest, getOrbitCredentials } from "../oauth-helpers";
import "./pill";
import "./tag";
import "./identity";

import iconCustomer from "bundle-text:../icons/icon-customer.svg";
import { ORBIT_API_ROOT_URL } from "../constants";

const TAG_LIMIT = 5;

class Widget extends TailwindMixin(LitElement) {
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
    this.showAllTags = false;

    this.isAMember = false;

    this.member = {};

    this.workspace = "";
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
        <div role="none">${this.getTemplateContent()}</div>

        ${!this.isLoading && !this.hasAuthError && !this.hasOtherError
          ? this.actionsTemplate()
          : nothing}
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

    if (this.isAMember) return this.memberTemplate();
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
      <div class="py-1 px-4 truncate" role="menuitem">
        <section class="mt-1">
          <!-- Name -->
          <span class="block text-xl font-bold text-gray-900 truncate"
            >${this.member.name}</span
          >

          <!-- Title -->
          <span class="block text-sm text-gray-500 truncate"
            >${this.member.jobTitle}</span
          >

          <!-- Organization -->
          ${
            this.member.organization &&
            html`
            <div class="flex flex-row justify-start items-center mt-1 mb-3">
              ${
                this.member.organization.logo_url &&
                html` <img
                  class="mr-1 w-5 h-5"
                  src="${this.member.organization.logo_url}"
                />`
              }
              <a
                href="${this.member.organization.website}"
                target="_blank"
                rel="noreferrer"
                class="mr-2 text-sm text-blue-500 hover:underline"
                >${this.member.organization.name}</a
              >
              ${
                this.member.organization.lifecycle_stage === "customer"
                  ? unsafeSVG(iconCustomer)
                  : nothing
              }
            </div>
          </section>
          `
          }

          <!-- Pills -->
          <section
            class="flex flex-row justify-start items-center mb-3 space-x-1"
          >
            ${
              this.member.teammate
                ? html`<obe-pill value="Teammate"></obe-pill>`
                : html`<obe-pill
                    name="Orbit Level"
                    value="${this.member.orbitLevel || "N/A"}"
                  ></obe-pill>`
            }
            ${
              this.member.lastActivityOccurredAt &&
              html` <obe-pill
                name="Last active"
                value="${_formatDate(this.member.lastActivityOccurredAt)}"
              ></obe-pill>`
            }
          </section>

          <!-- Identities -->
          ${
            !!this.member.identities &&
            html` <section class="mb-3">
              <p class="block text-sm text-gray-500 uppercase truncate">
                Linked profiles & emails
                <span class="ml-1 text-gray-900"
                  >${this.member.identities.length}</span
                >
              </p>
              <div
                class="flex flex-row flex-wrap gap-1 justify-start items-center py-1"
              >
                ${this.member.identities.map(
                  (identity) =>
                    html`<obe-identity .identity=${identity}></obe-identity>`
                )}
              </div>
            </section>`
          }

          <!-- Tags -->
          ${
            !!this.member.tags &&
            html` <section class="mb-3">
              <p class="block text-sm text-gray-500 uppercase truncate">
                Tags
                <span class="ml-1 text-gray-900"
                  >${this.member.tags.length}</span
                >
              </p>
              <div
                class="flex flex-row flex-wrap gap-1 justify-start items-center py-1"
              >
                ${this.member.tags.map((tag, index) => {
                  // Do not render tags that are above tag limit, unless we are showing all
                  if (!this.showAllTags && index > TAG_LIMIT) {
                    return;
                  }

                  // If we have reached limit, show button to show all tags
                  if (!this.showAllTags && index === TAG_LIMIT) {
                    return html`<button
                      @click="${this._showAllTags}"
                      class="text-gray-500 cursor-pointer"
                    >
                      Show ${this.member.tags.length - TAG_LIMIT} more tags
                    </button>`;
                  }

                  // Otherwise, render tag
                  return html`<obe-tag tag=${tag}></obe-tag>`;
                })}
              </div>
            </section>`
          }
      </div>
    `;
  }

  actionsTemplate() {
    return this.isAMember
      ? html`
          <hr class="block border-t border-[#d0d7de] mt-[6px]" role="none" />
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="${ORBIT_API_ROOT_URL}/${this.workspace}/members/${this.member
              .slug}"
            class="block py-2 px-4 text-sm text-gray-700 truncate bg-gray-50 rounded-md hover:bg-gray-100 focus:bg-gray-100"
            role="menuitem"
          >
            See ${this.username}’s profile on Orbit
          </a>
        `
      : html`
          <button
            class="block py-2 px-4 text-sm text-gray-700 truncate bg-gray-50 rounded-md hover:bg-gray-100 focus:bg-gray-100"
            role="menuitem"
            @click="${this._addMemberToWorkspace}"
          >
            Add ${this.username} to ${this.workspace} on Orbit
          </button>
        `;
  }

  _toggle() {
    this.isOpen = !this.isOpen;
  }

  _showAllTags() {
    this.showAllTags = true;
    this.requestUpdate();
  }

  _buildMemberData(member, included) {
    const identities = member.relationships.identities.data.map(
      ({ id, type }) =>
        included.find(
          ({ id: included_id, type: included_type }) =>
            id === included_id && type === included_type
        )?.attributes
    );

    const organizations = member.relationships.organizations.data.map(
      ({ id, type }) =>
        included.find(
          ({ id: included_id, type: included_type }) =>
            id === included_id && type === included_type
        )?.attributes
    );

    const organization = organizations[0] || null;

    this.isAMember = true;
    this.member = {
      name: member.attributes.name,
      jobTitle: member.attributes.title,
      slug: member.attributes.slug,
      teammate: member.attributes.teammate,
      orbitLevel: member.attributes.orbit_level,
      organization: organization,
      lastActivityOccurredAt: member.attributes.last_activity_occurred_at,
      tags: member.attributes.tags,
      identities: identities,
    };
  }

  _formatDate(date) {
    return new Date(Date.parse(date)).toLocaleDateString("en-EN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async _loadOrbitData() {
    if (!this.isLoading) {
      this.isLoading = true;

      const ORBIT_CREDENTIALS = await getOrbitCredentials();

      const { status, success, response } = await chrome.runtime.sendMessage({
        operation: "LOAD_MEMBER_DATA",
        username: this.username,
        platform: this.platform,
        ORBIT_CREDENTIALS,
      });

      this.workspace = ORBIT_CREDENTIALS.WORKSPACE;

      if (status === 401) {
        this.hasAuthError = true;
      } else if (status === 404) {
        this.isAMember = false;
      } else if (success === false) {
        this.hasError = true;
      } else {
        const { data, included } = response;

        if (!data) {
          this.isAMember = false;
          this.hasError = true;
          this.isLoading = false;

          this.requestUpdate();
          return;
        }

        this._buildMemberData(data, included);
      }

      this.isLoading = false;
      this.requestUpdate();
    }
  }

  async _addMemberToWorkspace() {
    this.isLoading = true;
    this.requestUpdate();

    const ORBIT_CREDENTIALS = await getOrbitCredentials();

    const { success, response, ok } = await chrome.runtime.sendMessage({
      operation: "ADD_MEMBER_TO_WORKSPACE",
      username: this.username,
      ORBIT_CREDENTIALS,
    });

    if (!success || !ok) {
      // FIXME: Error state
    } else {
      this._buildMemberData(response.data, response.included);
      this.isLoading = false;
      this.requestUpdate();
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
