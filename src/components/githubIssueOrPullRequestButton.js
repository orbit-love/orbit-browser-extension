import { LitElement, html, unsafeCSS } from "lit";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";

import tailwindStylesheet from "bundle-text:../styles/tailwind.global.css";
import orbitLogo from "bundle-text:../icons/orbit-logo.svg";

@customElement("obe-github-issue-or-pull-request-button")
class GitHubIssueOrPullRequestButton extends LitElement {
  static styles = [unsafeCSS(tailwindStylesheet)];

  render() {
    return html`
      <div>
        <button
          type="button"
          class="inline-block px-[8px] py-[4px] text-[#656d76] hover:text-[#6c4df6]"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span class="sr-only">Open Orbit widget</span>
          ${unsafeSVG(orbitLogo)}
        </button>
      </div>
    `;
  }
}
