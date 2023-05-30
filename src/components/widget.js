import { LitElement, html, css, nothing, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import "./pill";
import "./tag";
import "./identity";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import iconCustomer from "bundle-text:../icons/icon-customer.svg";
import { ORBIT_API_ROOT_URL } from "../constants";
import {
  buildMemberData,
  formatDate,
  isRepoInOrbitWorkspace,
  getThreshold,
} from "../helpers/widget-helper";

const TAG_LIMIT = 5;
const IDENTITY_LIMIT = 7;

@customElement("obe-widget")
class Widget extends LitElement {
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
    this.hasLoaded = false;
    this.hasAuthError = false;

    this.hasError = false;
    this.hasAdditionalDataError = false;
    this.hasActionsError = false;

    this.showAllTags = false;
    this.showAllIdentities = false;

    this.isAMember = false;

    this.member = {};
    this.additionalData = [];

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

  // Main template for the widget
  // Provides common wrapper elements, then chooses which content to show inside
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

        ${this.additionalData.length > 0 || this.hasAdditionalDataError
          ? this.additionalDataTemplate()
          : nothing}
        ${!this.isLoading && !this.hasAuthError && !this.hasOtherError
          ? this.actionsTemplate()
          : nothing}
      </div>
    `;
  }

  /**
   * Decides which content to show inside widget
   * If loading, show loading state
   * If any errors present, show relevant error message
   * If member present, show member
   *
   * @returns {HTMLElement}
   */
  getTemplateContent() {
    // TODO: check if member present, use generic error as default state instead?
    if (this.isLoading) return this.textTemplate("Loading Orbit data…");
    if (this.hasAuthError) return this.authErrorTemplate();
    if (this.hasError)
      return this.textTemplate("There was an error fetching Orbit data.");

    if (this.isAMember) return this.memberTemplate();
  }

  /**
   * Generic template to show text
   *
   * @returns {HTMLElement}
   */
  textTemplate(text) {
    return html`
      <span
        class="block py-1 px-4 text-sm text-gray-500 truncate"
        role="menuitem"
        >${text}</span
      >
    `;
  }

  /**
   * Shows auth error message, and link to
   * options page to re-authenticate
   *
   * @returns {HTMLElement}
   */
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

  /**
   * Shows full member content
   *
   * @returns {HTMLElement}
   */
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
            !!this.member.organization
              ? html`
            <div class="flex flex-row justify-start items-center mt-1">
              ${
                this.member.organization.logo_url &&
                html`<img
                  class="mr-1 w-5 h-5"
                  src="${this.member.organization.logo_url}"
                />`
              }
              <!-- If organisation doesn't include a protocol (ie https://),
              prepend it with // so it's treated as absolute regardless -->
              <a
                href="${
                  this.member.organization.website.match("//")
                    ? this.member.organization.website
                    : `//${this.member.organization.website}`
                }"
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
              : // Just used for spacing when the organisation is not present
                html`<div class="mt-2"></div>`
          }

          <!-- Pills -->
          <section
            class="flex flex-row justify-start items-center mt-1 space-x-1"
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
                value="${formatDate(this.member.lastActivityOccurredAt)}"
              ></obe-pill>`
            }
          </section>

          <!-- Identities -->
          ${
            !!this.member.identities &&
            html` <section class="mt-3">
              <p class="block text-sm text-gray-500 uppercase truncate">
                Linked profiles & emails
                <span class="ml-1 text-gray-900"
                  >${this.member.identities.length}</span
                >
              </p>
              <div
                class="flex flex-row flex-wrap gap-1 justify-start items-center py-1"
              >
                ${this.member.identities.map((identity, index) => {
                  // Do not render identities that are above identity limit, unless we are showing all
                  if (!this.showAllIdentities && index > IDENTITY_LIMIT) {
                    return;
                  }

                  // If we have reached limit, show button to show all identities
                  if (!this.showAllIdentities && index === IDENTITY_LIMIT) {
                    return html`<button
                      @click="${this._toggleIdentities}"
                      class="text-gray-500 cursor-pointer"
                    >
                      Show ${this.member.identities.length - IDENTITY_LIMIT}
                      more linked profiles
                    </button>`;
                  }

                  // Otherwise, render identity
                  return html`<obe-identity
                    .identity=${identity}
                  ></obe-identity>`;
                })}

                <!-- If identities are expanded, show option to hide extras -->
                ${this.showAllIdentities
                  ? html`<button
                      @click="${() => this._toggleIdentities(false)}"
                      class="text-gray-500 cursor-pointer"
                    >
                      Show fewer
                    </button>`
                  : nothing}
              </div>
            </section>`
          }

          <!-- Tags -->
          ${
            !!this.member.tags &&
            html` <section class="mt-3">
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
                      @click="${this._toggleTags}"
                      class="text-gray-500 cursor-pointer"
                    >
                      Show ${this.member.tags.length - TAG_LIMIT} more tags
                    </button>`;
                  }

                  // Otherwise, render tag
                  return html`<obe-tag
                    tag=${tag}
                    workspace=${this.workspace}
                  ></obe-tag>`;
                })}

                <!-- If tags are expanded, show option to hide extras -->
                ${this.showAllTags
                  ? html`<button
                      @click="${() => this._toggleTags(false)}"
                      class="text-gray-500 cursor-pointer"
                    >
                      Show fewer
                    </button>`
                  : nothing}
              </div>
            </section>`
          }
      </div>
    `;
  }

  /**
   * Renders any additional data - this is stored as an array of strings,
   * so this iterates over & prints each one
   *
   * @returns {HTMLElement}
   */
  additionalDataTemplate() {
    return html`${this.isAMember
        ? html`<hr class="block border-t border-[#d0d7de]" role="none" />`
        : nothing}
      <section class="flex flex-col gap-2 py-2 px-4 truncate">
        ${this.hasAdditionalDataError
          ? html`<p>There was an error fetching data</p>`
          : this.additionalData.map((datum) => html`<p>${datum}</p>`)}
      </section> `;
  }

  /**
   * Renders actions to show at the bottom of the widget
   * If member exists, "view profile on orbit"
   * Otherwise, "add to orbit"
   *
   * @returns {HTMLElement}
   */
  actionsTemplate() {
    if (this.hasActionsError) {
      return html`
        <hr class="block border-t border-[#d0d7de]" role="none" />
        <p class="py-2 px-4">There was an error performing this action</p>
      `;
    } else if (this.isAMember) {
      return html`
        <hr class="block border-t border-[#d0d7de]" role="none" />
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="${ORBIT_API_ROOT_URL}/${this.workspace}/members/${this.member
            .slug}"
          class="block py-2 px-4 w-full text-sm text-left text-gray-700 truncate bg-gray-50 rounded-b-md hover:bg-gray-100 focus:bg-gray-100"
          role="menuitem"
        >
          See ${this.username}’s profile on Orbit
        </a>
      `;
    } else {
      return html`
        ${this.additionalData.length > 0
          ? html`<hr class="block border-t border-[#d0d7de]" role="none" />`
          : nothing}
        <button
          class="block py-2 px-4 w-full text-sm text-left text-gray-700 truncate bg-gray-50 rounded-b-md hover:bg-gray-100 focus:bg-gray-100"
          role="menuitem"
          @click="${this._addMemberToWorkspace}"
        >
          Add ${this.username} to ${this.workspace} on Orbit
        </button>
      `;
    }
  }

  _toggle() {
    this.isOpen = !this.isOpen;
  }

  _toggleTags(showTags = true) {
    this.showAllTags = showTags;
    this.requestUpdate();
  }

  _toggleIdentities(showIdentities = true) {
    this.showAllIdentities = showIdentities;
    this.requestUpdate();
  }

  /**
   * Run on mouseover of widget - loads member data & additional data
   * via background.js, then re-renders widget with new data.
   * Uses `hasLoaded` to prevent requests running repeatedly
   */
  async _loadOrbitData() {
    if (!this.isLoading && !this.hasLoaded) {
      this.isLoading = true;
      this.requestUpdate();

      // Perform requests sequentially instead of using Promise.all, as
      // _loadAdditionalData relies on the member retrieved from _loadMemberData.
      await this._loadMemberData();
      await this._loadAdditionalData();

      this.isLoading = false;
      this.hasLoaded = true;
      this.requestUpdate();
    }
  }

  /**
   * Fetch member data & store it in state
   */
  async _loadMemberData() {
    const { status, success, response } = await chrome.runtime.sendMessage({
      operation: "LOAD_MEMBER_DATA",
      username: this.username,
      platform: this.platform,
    });

    if (status === 401) {
      this.hasAuthError = true;
    } else if (status === 404) {
      this.isAMember = false;
      this.workspace = response?.workspace;
    } else if (success === false) {
      this.hasError = true;
    } else {
      const { data, included, workspace } = response;

      if (!data) {
        this.isAMember = false;
        this.hasError = true;
        return;
      }

      this.workspace = workspace;
      this.isAMember = true;
      this.member = buildMemberData(data, included);
    }
  }

  /**
   * Fetch additional data & store it in state
   */
  async _loadAdditionalData() {
    if (this.platform !== "github") return;

    const isRepoInWorkspace = await isRepoInOrbitWorkspace();
    const repositoryFullName = `${window.location.pathname.split("/")[1]}/${
      window.location.pathname.split("/")[2]
    }`;

    const { success, response } = await chrome.runtime.sendMessage({
      operation: "LOAD_ADDITIONAL_DATA",
      username: this.username,
      platform: this.platform,
      repositoryFullName,
      member: this.member.slug,
      isRepoInWorkspace: isRepoInWorkspace,
    });

    if (!success) {
      this.hasAdditionalDataError = true;
      return;
    }

    this.additionalData = [
      `Contributed ${getThreshold(
        response.contributions_total
      )} times on GitHub`,
    ];

    if (response.contributions_on_this_repo_total === 1) {
      this.additionalData.push("First contribution to this repository");
    } else if (!isRepoInWorkspace) {
      return;
    } else {
      this.additionalData.push(
        `Contributed ${getThreshold(
          response.contributions_on_this_repo_total
        )} times to this repository`
      );
    }
  }

  /**
   * Handler for the "add member" button
   * Adds member, then updates widget to show the new member
   */
  async _addMemberToWorkspace() {
    this.isLoading = true;
    this.requestUpdate();

    const { success, response, ok } = await chrome.runtime.sendMessage({
      operation: "ADD_MEMBER_TO_WORKSPACE",
      username: this.username,
      platform: this.platform,
    });

    if (!success || !ok) {
      this.hasActionsError = true;
      this.isLoading = false;
      this.requestUpdate();
      return;
    } else {
      this.isAMember = true;
      this.member = buildMemberData(response.data, response.included);
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  static styles = [
    unsafeCSS(tailwindStylesheet),
    css`
      :host:not(:defined) {
        display: none;
      }
    `,
  ];

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
