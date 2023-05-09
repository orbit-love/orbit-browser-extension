import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { TailwindMixin } from "../utils/tailwindMixin";

import { ORBIT_API_ROOT_URL } from '../constants'

@customElement("obe-tag")
class Tag extends TailwindMixin(LitElement) {
  @property() tag: string;
  @property() workspace: string;

  render() {
    return html`
      <a href="${ORBIT_API_ROOT_URL}/${this.workspace}/members?tags_contains_any_of[]=${this.tag}" title="View all members tagged ${this.tag} in Orbit" target="_blank" rel="noreferrer">
        <span class="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">${this.tag}</span>
      </a>
    `;
  }
}
