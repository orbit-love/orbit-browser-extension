import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { AdditionalData } from '../types';
import { TailwindMixin } from "../utils/tailwindMixin";

export default class AdditionalDataComponent extends TailwindMixin(LitElement) {
  @property() additionalData: AdditionalData | undefined;
}
