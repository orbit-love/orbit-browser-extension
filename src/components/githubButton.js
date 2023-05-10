import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("obe-github-button")
export class GitHubButton extends LitElement {
  render() {
    return html`
      <button>
        <span class="sr-only">Open options</span>
        Github button
      </button>
    `;
  }
}
