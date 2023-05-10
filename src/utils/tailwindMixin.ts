import { adoptStyles, LitElement, unsafeCSS } from "lit";

import styles from "bundle-text:../styles/tailwind.global.css";

declare global {
  export type LitMixin<T = unknown> = new (...args: any[]) => T & LitElement;
}

const stylesheet = unsafeCSS(styles);

export const TailwindMixin = <T extends LitMixin>(superClass: T): T =>
  class extends superClass {
    connectedCallback() {
      super.connectedCallback();
      adoptStyles(this.shadowRoot, [stylesheet]);
    }
  };
