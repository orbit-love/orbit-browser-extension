import { adoptStyles, unsafeCSS } from "lit";

import styles from "bundle-text:../styles/tailwind.global.css";

const stylesheet = unsafeCSS(styles);

export const TailwindMixin = (superClass) => {
  return class extends superClass {
    connectedCallback() {
      super.connectedCallback();
      adoptStyles(this.shadowRoot, [stylesheet]);
    }
  };
};
