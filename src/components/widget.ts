import { LitElement, html, css, nothing } from "lit";
import {
  customElement,
  property,
  state,
  queryAssignedElements,
} from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import AdditionalDataComponent from "./additionalDataComponent";
import "./pillComponent";
import "./identityComponent";
import "./tagComponent";
import { TailwindMixin } from "../utils/tailwindMixin";
import { Member } from "../types";

const TAG_LIMIT = 3;

import iconCustomer from "bundle-text:../icons/icon-customer.svg";
@customElement("obe-widget")
class Widget extends TailwindMixin(LitElement) {
  @property() username: string;
  @property() platform: string;

  @state() isOpen = false;
  @state() showAllTags = false;

  @state() hasAuthError = false;
  @state() hasOtherError = false;
  @state() isLoading = false;
  @state() hasLoaded = false;
  @state() workspace: String;

  @state() isAMember: Boolean;
  @state() member: Member | null = null;

  @queryAssignedElements({ slot: "additional-data" })
  _additionalDataSlots!: Array<AdditionalDataComponent>;

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
        class="obe-dropdown absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        aria-hidden="${!this.isOpen}"
        tabindex="-1"
        style="visibility: ${this.isOpen ? "visible" : "hidden"}"
      >
        <div class="py-1" role="none">
          <!-- Active: "bg-gray-100 text-gray-900", Not Active: "text-gray-700" -->
          ${this.isLoading ? this.loadingTemplate() : nothing}
          ${this.hasAuthError ? this.authErrorTemplate() : nothing}
          ${this.hasOtherError ? this.otherErrorTemplate() : nothing}
          ${this.hasLoaded &&
          !this.hasAuthError &&
          !this.hasOtherError &&
          this.isAMember
            ? this.memberInfosTemplate()
            : nothing}
          <slot name="additional-data"></slot>
          ${this.hasLoaded && !this.hasAuthError && !this.hasOtherError
            ? this.actionsTemplate()
            : nothing}
        </div>
      </div>
    `;
  }

  loadingTemplate() {
    return html`
      <span
        class="text-gray-500 block truncate px-4 py-1 text-sm"
        role="menuitem"
        >Loading Orbit data…</span
      >
    `;
  }

  authErrorTemplate() {
    return html`
      <span
        class="text-gray-500 block truncate px-4 py-1 text-sm"
        role="menuitem"
        >Authentication error: API token or workspace is missing or
        invalid</span
      >
      <span
        @click=${() => chrome.runtime.sendMessage("showOptions")}
        class="cursor-pointer text-gray-500 block px-4 py-1 text-sm"
        role="menuitem"
        >Click here or on the extension icon to authenticate.</span
      >
    `;
  }

  otherErrorTemplate() {
    return html`
      <span
        class="text-gray-500 block truncate px-4 py-1 text-sm"
        role="menuitem"
        >There was an error fetching Orbit data.</span
      >
    `;
  }

  memberInfosTemplate() {
    return html`
      <div class="truncate px-4" role="menuitem">
        <!-- Name -->
        <span
          class="font-bold text-xl text-gray-900 block truncate pt-1 text-sm"
          >${this.member.name}</span
        >
        <!-- Title -->
        <span class="text-gray-500 block truncate text-sm"
          >${this.member.jobTitle}</span
        >
        <!-- Organization -->
        ${this.member.organization &&
        html`
          <div class="flex flex-row items-center justify-start pt-1">
            <img class="w-5 h-5" src="${this.member.organization.logo_url}" />
            <a
              href="${this.member.organization.website}"
              target="_blank"
              rel="noreferrer"
              class="text-sm ml-1 mr-2 text-blue-500 hover:underline"
              >${this.member.organization.name}</a
            >
            ${this.member.organization.lifecycle_stage === "customer"
              ? unsafeSVG(iconCustomer)
              : nothing}
          </div>
        `}
        <!-- Pills -->
        <p class="text-gray-500 block truncate pt-3 pb-1 text-sm uppercase">
            Orbit Model
        </p>
        <div class="flex flex-row items-center justify-start space-x-1 pt-1">
          ${this.member.orbitLevel === null
            ? html`<obe-pill value="Teammate"></obe-pill>`
            : html`<obe-pill
                name="Orbit Level"
                value="${this.member.orbitLevel}"
              ></obe-pill>`}
          <obe-pill
            name="Last active"
            value="${new Date(
              Date.parse(this.member.lastActivityOccurredAt)
            ).toLocaleDateString("en-EN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}"
          ></obe-pill>
        </div>
        <!-- Identities -->
        <p class="text-gray-500 block truncate pt-3 pb-1 text-sm uppercase">
            Linked profiles & emails
            <span class="ml-1 text-gray-900">${this.member.identities.length}</span>
        </p>
        <div class="flex flex-row items-center justify-start space-x-1 pt-1">
          ${this.member.identities.map(
            (identity) =>
              html`<obe-identity .identity=${identity}></obe-identity>`
          )}
        </div>
        <!-- Tags -->
        <p class="text-gray-500 block truncate pt-3 pb-1 text-sm uppercase">
            Tags
            <span class="ml-1 text-gray-900">${this.member.tags.length}</span>
        </p>
        <div class="pb-1 max-w-xs flex flex-row flex-wrap items-center justify-start gap-x-1 gap-y-1 pt-1">
          ${this.member.tags.map(
            (tag, index) => {
              if (!this.showAllTags && index > TAG_LIMIT) {
                return;
              }
              if (!this.showAllTags && index === TAG_LIMIT) {
                return html`<button @click="${this._showAllTags}" class="cursor-pointer text-gray-500">${this.member.tags.length - TAG_LIMIT} more tags</button>`
              }
              return html`<obe-tag tag=${tag}></obe-tag>`
            }
          )}
        </div>
      </div>
    `;
  }

  delimiterTemplate() {
    return html`
      <hr class="block border-t border-[#d0d7de] h-0 my-[6px]" role="none" />
    `;
  }

  actionsTemplate() {
    return this.isAMember
      ? html`
          ${this.delimiterTemplate()}
          <button
            class="text-gray-700 block truncate px-4 py-1 text-sm"
            role="menuitem"
          >
            See ${this.username}’s profile on Orbit
          </button>
        `
      : html`
          <button
            class="text-gray-700 block truncate px-4 py-1 text-sm"
            role="menuitem"
          >
            Add ${this.username} to ${this.workspace} on Orbit
          </button>
        `;
  }

  private _toggle() {
    this.isOpen = !this.isOpen;
  }

  private _showAllTags() {
    console.log('in here')
    this.showAllTags = true;
  }

  private async _loadOrbitData() {
    if (!this.isLoading && !this.hasLoaded) {
      this.isLoading = true;

      // /**
      //  * `await Promise.all[]` allows us to trigger both request (member info +
      //  * github user info) at the same time, resulting in better performance.
      //  */
      // const ORBIT_CREDENTIALS = { WORKSPACE: this.workspace, API_TOKEN: this.apiToken}
      // const [
      //   { status, slug, orbit_level, reach, love, tag_list },
      //   { contributions_total, success: successGithubUserRequest },
      // ] = await Promise.all([
      //     orbitAPI.getMemberContributions(ORBIT_CREDENTIALS, this.username),
      //     orbitAPI.getGitHubUserContributions(ORBIT_CREDENTIALS, this.username),
      //   ]);

      // console.log({status, slug})

      const response: any = await chrome.runtime.sendMessage({
        operation: "LOAD_MEMBER_DATA",
        username: this.username,
        platform: this.platform,
      });

      this.isLoading = false;
      this.hasLoaded = true;

      const { success, status, workspace, member, additionalData } = response;

      this.workspace = workspace;

      if (success === false && status === 401) {
        this.hasAuthError = true;
      } else if (success === false && status === 404) {
        this.isAMember = false;
      } else if (success === false) {
        this.hasOtherError = true;
      } else {
        this.isAMember = true;
        this.member = member;
      }

      this._additionalDataSlots[0].additionalData = additionalData;
    }
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
      <div class="relative inline-block font-sans text-left">
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
