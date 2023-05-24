import { LitElement, html } from "lit";
import { TailwindMixin } from "../utils/tailwindMixin";

class IdentityElement extends TailwindMixin(LitElement) {
  static get properties() {
    return {
      identity: { type: Object },
    };
  }

  getIconPath() {
    switch (this.identity.source) {
      case "email":
        return "icons/email.svg";
      case "discord":
      case "discourse":
      case "github":
      case "linkedin":
      case "reddit":
      case "slack":
      case "stack_overflow":
      case "twitter":
      case "youtube":
        return `icons/${this.identity.source}.png`;
      default:
        return "icons/custom-identity.svg";
    }
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
      <span
        class="inline-flex gap-x-1.5 items-center p-1 text-xs font-medium text-gray-900 rounded-md ring-1 ring-inset ring-gray-200"
      >
        <img
          title="${this.getTitle()}"
          class="w-6 h-6"
          src="${chrome.runtime.getURL(this.getIconPath())}"
        />
      </span>
    `;
  }

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

customElements.define("obe-identity", IdentityElement);
