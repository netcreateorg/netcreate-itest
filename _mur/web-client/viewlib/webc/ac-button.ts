/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  action button

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import StatelyElement from './lib/class-stately-element';
import type { DataObj, StateObj } from '../viewstate-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// WEB COMPONENT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ActionButton extends StatelyElement {
  //
  button: HTMLButtonElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    super.connectedCallback();
    const name = this.initName();
    const group = this.initGroup();
    this.shadowRoot!.innerHTML = `
    <button>${name}</button>
    `;
    this.button = this.shadowRoot!.querySelector('button')!;
    this.button.addEventListener('click', this.handleClick);
  }

  /// INCOMING METATDATA ///

  receiveMetadata(name: string, data: DataObj) {}

  /// LOCAL INPUT HANDLING ///

  private handleClick = (event: Event): void => {
    event.preventDefault();
    if (DBG) console.log('ac-button', this.name);
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ActionButton;
