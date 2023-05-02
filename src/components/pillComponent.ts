import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { TailwindMixin } from "../utils/tailwindMixin";

@customElement("obe-pill")
class Pill extends TailwindMixin(LitElement) {
  @property() name: string;
  @property() value: string;

  render() {
    return html`
      <div
        class="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs ring-1 ring-inset ring-gray-500/10"
      >
        ${this.name &&
        html`<span class="font-medium text-gray-600 mr-1">${this.name}</span>`}
        <span class="font-bold text-gray-700">${this.value}</span>
      </div>
    `;
  }
}
