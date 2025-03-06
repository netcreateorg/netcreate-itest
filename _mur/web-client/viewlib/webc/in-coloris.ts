/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UIColorPicker imports Coloris

  Since this is a web component, the Coloris library has issues with
  the shadow DOM. This component minimally hacks around it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import StatelyElement from './lib/class-stately-element';
import type { DataObj, StateObj } from '../viewstate-mgr';
import { ConsoleStyler } from '../../../common/util-prompts.ts';
//
import '@melloware/coloris/dist/coloris.css';
import Coloris from '@melloware/coloris';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('in-color', 'TagPink');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SWATCHES = {
  '#067bc2': 'blue',
  '#84bcda': 'lightblue',
  '#80e377': 'green',
  '#ecc30b': 'yellow',
  '#f37748': 'orange',
  '#d56062': 'red'
};

/// COLORIS RUNTIME INITIALIZATION ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Coloris.init();
Coloris({
  el: '.coloris', // used for wrapper div
  alpha: false, // disable selection with alpha
  format: 'hex', // output format
  swatchesOnly: true, // only show swatches
  swatches: Object.keys(SWATCHES) // swatches to show
});

/// WEB COMPONENT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class UIColorPicker extends StatelyElement {
  //
  input: HTMLInputElement;
  label: HTMLLabelElement;
  tooltip: HTMLDivElement;
  timer: ReturnType<typeof setTimeout>;
  //
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /** Called when element is inserted in DOM */
  connectedCallback() {
    super.connectedCallback();
    const name = this.name;
    this.shadowRoot!.innerHTML = `
<style>
  div.coloris {
    display: grid;
    grid-template-columns: 1fr auto;
    margin: 0.25rem;
  }
  label { padding-right: 0.5rem; }
  div.tooltip {
    position: fixed;
    background-color: gray;
    color: white;
    padding: 5px;
    z-index: 1000;
    max-width: 250px;
    display: none;
  }
  input { border: 1px solid #ccc8 }
  .clr-field button { display: none; }
</style>

<div class="coloris">
  <label for=${name}>${name}</label>
  <input type="text" name="${name}" data-coloris class="coloris-${name}">
  <div class="tooltip"></div>
</div>
    `;
    this.input = this.shadowRoot!.querySelector('input');
    this.input.readOnly = true;
    this.input.addEventListener('change', this.handleChange);
    this.label = this.shadowRoot!.querySelector('label')!;
    this.label.addEventListener('mouseover', this.handleHover);
    this.label.addEventListener('mouseout', this.handleHoverOut);
    this.tooltip = this.shadowRoot!.querySelector('div.tooltip')!;

    Coloris({ el: this.input });
  }

  /** Called when element is removed from DOM */
  disconnectedCallback() {
    super.disconnectedCallback();
    this.input.removeEventListener('change', this.handleChange);
  }

  /// INCOMING METATDATA, STATE ///

  /** UPDATE: data received is already filtered by element's group/name */
  receiveMetadata(meta: DataObj) {
    LOG(...PR(`receiveMetadata[${this.name}]`), meta);
    const { label, tooltip, placeholder } = meta;
    this.label.innerText = label;
    this.tooltip.innerText = tooltip;
    if (placeholder) this.input.placeholder = placeholder;
  }

  /** UPDATE: state is already filtered by element's group/name */
  receiveState(state: StateObj) {
    const { value: hexvalue } = state;
    this.input.value = SWATCHES[hexvalue] || hexvalue;
    this._updateColor(hexvalue);
  }

  /// LOCAL INPUT HANDLING ///

  /** EVENT: forward color change from Coloris */
  private handleChange = (e: Event) => {
    const hex = (e.target as HTMLInputElement).value;
    const state = this.encodeState({ value: hex });
    this.sendState(state);
  };

  /** EVENT: show tooltip on hover */
  private handleHover = (event: MouseEvent): void => {
    const { style: tt } = this.tooltip;
    // position tooltip above label
    const { style: ll } = this.label;
    ll.color = 'maroon';
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.tooltip.textContent === '') return;
      this.timer = null;
      tt.display = 'block';
      const labelRect = this.label.getBoundingClientRect();
      const ttRect = this.tooltip.getBoundingClientRect();
      tt.top = `${labelRect.top - ttRect.height}px`;
      tt.left = `${labelRect.left}px`;
    }, 1000);
  };

  /** EVENT: hide tooltip on mouseout */
  private handleHoverOut = (event: MouseEvent): void => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const { style } = this.tooltip;
    style.display = 'none';
    const { style: ll } = this.label;
    ll.color = 'inherit';
  };

  /// HELPERS ///

  _updateColor(hexvalue: string) {
    this.input.style.backgroundColor = hexvalue;
    const bright = this._getBrightness(this.input);
    if (bright > 125) this.input.style.color = 'black';
    else this.input.style.color = 'white';
  }

  _getBrightness(element: HTMLElement): number {
    const rgb = element.style.backgroundColor
      .match(/\d+/g)
      .map(elem => parseInt(elem));
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UIColorPicker;
