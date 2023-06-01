import { LitElement, html, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import { getIconPath } from "../helpers/widget-helper";

@customElement("obe-identity")
class IdentityElement extends LitElement {
  static get properties() {
    return {
      identity: { type: Object },
    };
  }

  getTitle() {
    switch (this.identity.source) {
      case "email":
        return `Email: ${this.identity.email}`;
      case "github":
        return `@${this.identity.username} on GitHub`;
      case "discourse":
        return `${this.identity.username} on ${this.identity.source_host}`;
      case "stack_overflow":
        return `${this.identity.username} on Stack Overflow`;
      case "twitter":
        return `@${this.identity.username} on Twitter`;
      case "linkedin":
        return `/in/${this.identity.username} on LinkedIn`;
      case "discord":
      case "reddit":
      case "slack":
      case "youtube":
        return `${this.identity.username} on ${
          this.identity.source.charAt(0).toUpperCase() +
          this.identity.source.slice(1)
        }`;
      default:
        return `${this.identity.profile_url || this.identity.url}`;
    }
  }

  identityTemplate() {
    return html`
      <li
        class="inline-flex gap-x-1.5 items-center py-0.5 px-1 text-xs font-medium text-gray-900 rounded-md ring-1 ring-inset ring-gray-100"
      >
        <img
          title="${this.getTitle()}"
          alt="${this.getTitle()}"
          class="w-6 h-6"
          src="${chrome.runtime.getURL(getIconPath(this.identity.source))}"
        />
      </li>
    `;
  }

  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    return html`
      ${this.identity.profile_url || this.identity.url
        ? html`
            <a
              href=${this.identity.profile_url || this.identity.url}
              target="_blank"
              rel="noreferrer"
            >
              ${this.identityTemplate()}
            </a>
          `
        : this.identityTemplate()}
    `;
  }
}
