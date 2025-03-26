/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  view state manager - manages view-related state

  The main state and metadata manager API are exposed as methods
  - GetStateGroup(name: string): StateObj
  - UpdateStateGroup(name: string, state: StateObj): void
  - GetMetadata(name: string): DataObj
  - UpdateMetadata(name: string, metadata: StateObj): void

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UIDataGroup from './class-datagroup.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj } from '../../_types/ursys.d.ts';
type StateObj = DataObj;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STATE = new UIDataGroup<StateObj>('state');
const METADATA = new UIDataGroup<DataObj>('meta');
const DBG = false;

/// API FUNCTIONS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** metadata is used for template info */
function UpdateMetadata(groupName: string, newMeta: DataObj): void {
  const event = METADATA.updateGroup(groupName, newMeta);
  if (DBG) console.log('dispatching meta', event);
  document.dispatchEvent(event);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** state is used for logical component state values and settings */
function UpdateStateGroup(groupName: string, newState: StateObj): void {
  const event = STATE.updateGroup(groupName, newState);
  if (DBG) console.log('dispatching state', event);
  document.dispatchEvent(event);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetMetadata(name: string): DataObj {
  return METADATA.getGroup(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetStateGroup(name: string): StateObj {
  return STATE.getGroup(name);
}

/// DEBUGGING EXPORTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
globalThis.update_meta = UpdateMetadata;
globalThis.update_state = UpdateStateGroup;
globalThis.get_meta = GetMetadata;
globalThis.get_state = GetStateGroup;
globalThis.state_mgr = STATE;
globalThis.meta_mgr = METADATA;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // component state
  GetStateGroup,
  UpdateStateGroup,
  // component metadata
  UpdateMetadata,
  GetMetadata
};
export type { DataObj, StateObj };
