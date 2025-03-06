/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UI_DataGroup<T> implements the UI data group manager for managing named sets
  of named properties based on DataObj { [key: string]: any }. This is a flat
  dictionary of named properties. 

  When a data group is updated, the new data is merged with the existing data
  and the group is updated. The data group is then dispatched as a custom event

  This class uses vanilla JS events for dispatching CustomEvent with the name
  'ui-<datatype>-update'.

  - NOTES -

  This is similar to `class-state-mgr` but does not have the stringent 
  conformance requirements. This is a more lightweight version intended
  for use in vanilla JS applications using SNA ViewLib.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as TEXT from '../../common/util-text.ts';
import * as NORM from '../../common/util-data-norm.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj } from '../../_types/ursys.d.ts';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class UI_DataGroup<T extends DataObj> {
  //
  private datatype: string;
  private _dict: Map<string, T>;

  constructor(typeName: string) {
    this._dict = new Map();
    this.datatype = TEXT.AssertKeyword(typeName).toLowerCase();
  }

  /** API: get data event name */
  public getDataEventName(): string {
    return `ui-${this.datatype}-update`;
  }

  /** API: update the group */
  public updateGroup(groupName: string, newData: Partial<T>): CustomEvent {
    const group = this._dict.get(groupName) || ({} as T);
    const data = { ...group, ...newData };
    this._dict.set(groupName, data);
    // return a custom event ready to be dispatched
    const eventName = this.getDataEventName();
    const detail = { group: groupName, type: this.datatype, [this.datatype]: data };
    const event = new CustomEvent(eventName, { detail });
    return event;
  }

  /** API: return a copy of group data */
  public getGroup(groupName: string): T {
    const group = this._dict.get(groupName) || {};
    if (!group) throw Error(`DataGroup '${groupName}' not found`);
    return NORM.DeepClone(group) as T;
  }

  /** API: return array of group names */
  public getGroupNames(): string[] {
    return Array.from(this._dict.keys());
  }

  /** API: return true if group exists */
  public hasGroup(groupName: string): boolean {
    return this._dict.has(groupName);
  }

  /* API: return a clone of the entire data of all groups */
  public getAllData(): T {
    const data = Object.fromEntries(this._dict.entries());
    return NORM.DeepClone(data) as T;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UI_DataGroup;
