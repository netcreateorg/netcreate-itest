/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UIGroup is the parent container StatelyElements (viewlib components).
  It is used to distribute state and metadata updates to its children.

  It has a 'group' attribute that is used to identify its slotted children
  that are StatelyElements. 

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { ConsoleStyler } from '../../../common/util-prompts.ts';
import { AssertGroupName } from './lib/meta-parser';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import StatelyElement from './lib/class-stately-element';
const LOG = console.log.bind(console);
const PR = ConsoleStyler('ui-group', 'TagGray');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CN = 'UIGroup:';
const DBG = false;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class UIGroup extends HTMLElement {
  private uiElements: { [name: string]: StatelyElement };
  private _slot!: HTMLSlotElement; // save found slot
  private _evtqueue: CustomEvent[];
  private group: string;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `<slot></slot>`;
    this.uiElements = {};
    this._evtqueue = [];
    // bind handlers
    this.handleSlotChange = this.handleSlotChange.bind(this);
    this.onStateUpdate = this.onStateUpdate.bind(this);
    this.onMetadataUpdate = this.onMetadataUpdate.bind(this);
  }

  connectedCallback(): void {
    const group = AssertGroupName(this.getAttribute('group'));
    this.group = group;
    //
    const slot = this.shadowRoot!.querySelector('slot');
    if (!slot) throw Error(`${CN} Slot element not found`);
    this._slot = slot;
    slot.addEventListener('slotchange', this.handleSlotChange);
    document.addEventListener('ui-meta-update', this.onMetadataUpdate);
    document.addEventListener('ui-state-update', this.onStateUpdate);
  }

  disconnectedCallback(): void {
    this._slot.removeEventListener('slotchange', this.handleSlotChange);
    this.removeEventListener('ui-meta-update', this.onMetadataUpdate);
    this.removeEventListener('ui-state-update', this.onStateUpdate);
  }

  /** called when the slots have changed or rendered, assigning the
   *  group attribute to the slotted elements unless one already exists */
  private handleSlotChange(): void {
    const slotNodes = this._slot.assignedElements();
    // remove uiElements that are no longer in the slot
    Object.keys(this.uiElements).forEach(key => {
      if (!slotNodes.includes(this.uiElements[key])) {
        delete this.uiElements[key];
        if (DBG) LOG(...PR(`input ${key} removed from group ${this.group}`));
      }
    });
    // add 'group' attribute to all slotted elements
    slotNodes.forEach(child => {
      if (child instanceof StatelyElement) {
        const inputName = child.getAttribute('name');
        if (!inputName) return;
        this.uiElements[inputName] = child;
        if (child.hasAttribute('group')) return;
        child.setAttribute('group', this.group);
        child.initGroup(); // remember to initialize
      }
    });

    this._processMetaQueue();
  }

  /// BOILERPLATE ///

  /** EVENT: When metadata is updated during first connectedCallback,
   *  it may need to queued until the slotchange event has been processed. */
  private onMetadataUpdate = (event: CustomEvent): void => {
    const { group } = event.detail;
    if (group !== this.group) return;
    //
    const elements = Object.values(this!.uiElements);
    if (elements.length === 0) {
      if (DBG) LOG(...PR('no elements found, queueing event', event));
      this._evtqueue.push(event);
      return;
    }
    this._processMetaQueue();
  };

  /** HELPER: process the metadata queue, sending metadata to elements
   *  with matching name. This is called when the slotchange event has
   *  been processed and the elements are available. */
  private _processMetaQueue = (): void => {
    if (DBG) LOG(...PR('processing metadata queue', this._evtqueue));
    // send metadata to elements with matching name
    this._evtqueue.forEach(event => {
      const { group, type, meta } = event.detail;
      const elements = Object.values(this.uiElements);
      elements.forEach(element => {
        const isStately = element instanceof StatelyElement;
        if (!isStately) return;
        const matchMeta = meta[element.name];
        if (!matchMeta) return;
        element.receiveMetadata(matchMeta);
      }); // elements
    }); // _evtqueue
    // clear queue
    this._evtqueue = [];
  };

  /** EVENT: State updates are sent by the state manager, and this
   *  method routes matching state to the elements in the group. */
  private onStateUpdate = (event: CustomEvent): void => {
    const { group, state } = event.detail;
    if (group !== this.group) return;
    // all elements if ui-group are of type group
    Object.values(this.uiElements).forEach(element => {
      if (!(element instanceof StatelyElement)) return;
      if (!(element.group === group)) return;
      const matchState = state[element.name];
      if (!matchState) return;
      element.receiveState(matchState);
    });
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UIGroup;
