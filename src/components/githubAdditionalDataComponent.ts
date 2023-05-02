import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import AdditionalDataComponent from './additionalDataComponent';
import { GithubAdditionalData } from '../types';

@customElement('obe-github-additional-data')
export default class GithubAdditionalDataComponent extends AdditionalDataComponent {
  render() {
    if (<GithubAdditionalData>this.additionalData === undefined) {
      return;
    }
    return html`
      <hr class="block border-t border-[#d0d7de] h-0 my-[6px]" role="none" />
      <span
        class="text-gray-500 block truncate px-4 py-1 text-sm"
        role="menuitem"
        >Contributed ${this.additionalData.contributionsTotal} times on
        GitHub</span
      >
    `
  }
}
