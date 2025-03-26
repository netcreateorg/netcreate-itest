/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A UIStatelyElement is a base class for all UI components need to 
  (1) communicate value changes to a centralized state manager 
  (2) initialize their options and template from a YAML textNode 
      associated with it.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { UpdateMetadata, UpdateStateGroup } from '../../viewstate-mgr';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj, StateObj } from '../../viewstate-mgr';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UIStatelyElement maintains connection with the centralized state manager
 *  and metadata manager above. It provides a base class for all UI components
 *  that need to communicate with the state manager and metadata manager. */
class UIStatelyElement extends HTMLElement {
  //
  name: string;
  group: string;
  //
  constructor() {
    super();
  }

  /// UTILITY ACCESSORS ///

  /** set this.name from string or from attribute */
  initName(name?: string): string {
    if (name === undefined) {
      if (this.getAttribute('name') === undefined) return;
      this.name = this.getAttribute('name');
      return this.name;
    }
    if (typeof name !== 'string')
      throw Error('UIStatelyElement name attribute must be a string');
    this.name = name;
    return this.name;
  }

  /** set this.group from string or from attribute. note that it
   *  the 'group' attribute may be assigned _after_ the element is created
   *  (e.g. ui-group on slotchange event), so if this.group is null check
   *  that it is called again */
  initGroup(group?: string): string {
    if (group === undefined) {
      if (this.getAttribute('group') === undefined) return;
      this.group = this.getAttribute('group');
      return this.group;
    }
    if (typeof group !== 'string')
      throw Error('UIStatelyElement group attribute must be a string');
    this.group = group;
    return this.group;
  }

  /// SUBCLASSER METHODS ///

  /** subclassers override to receive metadata. the sender is responsible for
   *  using subclass group/name to prefilter */
  receiveMetadata(meta: DataObj): void {}

  /** subclassers override to receive state. the sender is responsible for
   * using subclass group/name to prefilter */
  receiveState(state: StateObj): void {}

  /** subclassers use this as-is */
  sendMetadata(metagroup: string, meta: DataObj): void {
    UpdateMetadata(metagroup, meta);
  }

  /** subclassers use this as-is */
  sendState(state: StateObj): void {
    const groupName = this.group || this.getAttribute('group');
    UpdateStateGroup(groupName, state);
  }

  /// HELPERS ///

  /** given an unadorned state object, return a new object with the name as key */
  encodeState(state: StateObj): StateObj {
    return { [this.name]: state };
  }

  /** given a state object, try to find matching object in the state, first
   *  looking for groupName/name, then just name. If not found, return {} */
  findState(statish: StateObj): StateObj {
    const groupName = this.group;
    const name = this.name || this.getAttribute('name');
    if (statish[groupName]) {
      const obj = statish[groupName][name];
      if (obj === undefined) return {};
      return obj;
    }
    if (statish[name]) return statish[name];
    return {};
  }

  /// BOILERPLATE ///

  /** vestigial methods for subclassers */
  connectedCallback(): void {
    this.initName(); // this is usually valid
    this.initGroup(); // see comments for function
  }

  /** vestigial methods for subclassers */
  disconnectedCallback(): void {}
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UIStatelyElement; // the class
