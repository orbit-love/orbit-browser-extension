import { LitElement, html, css, nothing, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import "./pill";
import "./tag";
import "./identity";
import "./additionalData";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import iconCustomer from "bundle-text:../icons/icon-customer.svg";
import iconOrbitLevel from "bundle-text:../icons/icon-orbit-level.svg";
import { ORBIT_ROOT_URL } from "../constants";
import {
  buildMemberData,
  formatDate,
  isRepoInOrbitWorkspace,
  getThreshold,
} from "../helpers/widget-helper";

const TAG_LIMIT = 5;
const IDENTITY_LIMIT = 5;

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
        class="obe-dropdown ring-opacity-5 absolute right-0 top-10 z-10 w-80 bg-white rounded-md ring-1 ring-black shadow-lg origin-top-right focus:outline-none"
        role="article"
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
      <span class="block px-4 py-5 text-gray-900 truncate">${text}</span>
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
      <span class="block px-4 py-5 text-sm text-gray-900 truncate"
        >Authentication error: API token or workspace is missing or
        invalid</span
      >
      <span
        @click=${() => chrome.runtime.sendMessage("showOptions")}
        class="block py-5 px-4 w-full rounded-b-md text-left text-[#6C4DF6] font-semibold cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
        >Click here or on the extension icon to authenticate &rarr;</span
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
      <div class="px-4 py-5">
        <section class="flex gap-4">
          <!-- Avatar -->
          ${this.member.avatarUrl &&
          html`<img
            alt=""
            class="w-14 h-14 rounded-full"
            src="${this.member.avatarUrl}"
          />`}

          <div class="flex flex-col">
            <!-- Name -->
            <span class="block text-lg font-semibold leading-5 text-gray-900"
              >${this.member.name}</span
            >

            <!-- Title -->
            <span class="block text-sm leading-5 text-gray-500"
              >${this.member.jobTitle}</span
            >

            <!-- Organization -->
            ${!!this.member.organization
              ? html`
                  <div
                    class="flex flex-row justify-start items-center mt-1 leading-5"
                  >
                    ${this.member.organization.logo_url &&
                    html`<img
                      alt=""
                      class="mr-1 w-5 h-5"
                      src="${this.member.organization.logo_url}"
                    />`}
                    <!-- If organisation doesn't include a protocol (ie https://), add one so it's treated as absolute -->
                    <a
                      href="${this.member.organization.website.match(
                        /https?:\/\//
                      )
                        ? this.member.organization.website
                        : `https://${this.member.organization.website}`}"
                      target="_blank"
                      rel="noreferrer"
                      class="mr-2 text-sm font-semibold text-[#6C4DF6] hover:underline"
                      >${this.member.organization.name}</a
                    >
                    ${this.member.organization.lifecycle_stage === "customer"
                      ? html`<span class="sr-only">Customer</span>
                          <span aria-hidden="true"
                            >${unsafeSVG(iconCustomer)}</span
                          >`
                      : nothing}
                  </div>
                `
              : // Just used for spacing when the organisation is not present
                html`<div class="mt-2"></div>`}
          </div>
        </section>

        <!-- Pills -->
        <section
          class="flex flex-row justify-start items-center mt-3 space-x-1"
        >
          ${this.member.teammate
            ? html`<obe-pill
                icon="${iconOrbitLevel}"
                value="Teammate"
              ></obe-pill>`
            : !!this.member.orbitLevel
            ? html`<obe-pill
                icon="${iconOrbitLevel}"
                name="Orbit"
                value="${this.member.orbitLevel || "N/A"}"
              ></obe-pill>`
            : nothing}
          ${this.member.lastActivityOccurredAt &&
          html` <obe-pill
            name="Last Active"
            value="${formatDate(this.member.lastActivityOccurredAt)}"
          ></obe-pill>`}
        </section>

        <hr class="block my-5 border-t border-gray-100" role="none" />

        <!-- Identities -->
        ${!!this.member.identities && this.member.identities.length > 0
          ? html`<section>
              <p class="sr-only">
                ${this.member.identities.length} linked profiles & emails
              </p>
              <ul
                class="flex flex-row flex-wrap gap-1 justify-start items-center"
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
                      class="py-1 px-1.5 text-sm text-gray-500 rounded-md ring-1 ring-inset ring-gray-100 cursor-pointer"
                    >
                      +${this.member.identities.length - IDENTITY_LIMIT} more
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
                      class="py-1 px-1.5 text-sm text-gray-500 rounded-md ring-1 ring-inset ring-gray-100 cursor-pointer"
                    >
                      Show fewer
                    </button>`
                  : nothing}
              </ul>
            </section>`
          : nothing}

        <!-- Tags -->
        ${!!this.member.tags && this.member.tags.length > 0
          ? html`<section class="mt-5">
              <p class="sr-only">${this.member.tags.length} tags</p>
              <ul
                class="flex flex-row flex-wrap gap-x-1 gap-y-1.5 justify-start items-center"
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
                      class="py-1 px-1.5 text-sm text-gray-500 rounded-md ring-1 ring-inset ring-gray-100 cursor-pointer"
                    >
                      +${this.member.tags.length - TAG_LIMIT} more
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
                      class="py-1 px-1.5 text-sm text-gray-500 rounded-md ring-1 ring-inset ring-gray-100 cursor-pointer"
                    >
                      Show fewer
                    </button>`
                  : nothing}
              </ul>
            </section>`
          : nothing}
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
      ? html`<hr class="block border-t border-gray-100" role="none" />`
      : nothing}
    ${this.hasAuthError
      ? nothing
      : html`<section class="flex flex-col gap-2 px-4 py-5">
          ${this.hasAdditionalDataError
            ? html`<p class="text-gray-900">
                There was an error fetching site data
              </p>`
            : this.additionalData.map(
                (datum) =>
                  html`<obe-additional-data
                    value="${datum}"
                    platform="${this.platform}"
                  ></obe-additional-data>`
              )}
        </section>`} `;
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
        <hr class="block border-t border-gray-100" role="none" />
        <p class="px-4 py-5">There was an error performing this action</p>
      `;
    } else if (this.isAMember) {
      return html`
        <hr class="block border-t border-gray-100" role="none" />
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="${ORBIT_ROOT_URL}/${this.workspace}/members/${this.member
            .slug}"
          class="block py-5 px-4 w-full text-left text-[#6C4DF6] font-semibold truncate rounded-b-md hover:bg-gray-100 focus:bg-gray-100"
        >
          Visit Orbit profile &rarr;
        </a>
      `;
    } else {
      return html`
        ${this.additionalData.length > 0
          ? html`<hr class="block border-t border-gray-100" role="none" />`
          : nothing}
        <button
          class="block py-5 px-4 w-full text-left text-[#6C4DF6] font-semibold truncate rounded-b-md hover:bg-gray-100 focus:bg-gray-100"
          @click="${this._addMemberToWorkspace}"
        >
          Add to Orbit
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
   * Run on mouseover or focus of widget - loads member data & additional data
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
      `${getThreshold(response.contributions_total)} GitHub Contributions`,
    ];

    if (response.contributions_on_this_repo_total === 1) {
      this.additionalData.push("First contribution to this repository");
    } else if (!isRepoInWorkspace) {
      return;
    } else {
      this.additionalData.push(
        `${getThreshold(
          response.contributions_on_this_repo_total
        )} contributions on this repository`
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
          @focusin="${this._loadOrbitData}"
        ></slot>
        ${this.dropdownTemplate()}
      </div>
    `;
  }
}
