/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / SETTINGS CLIENTS
  this module connects with server-side mur-settings-mgr.mts module
  and stays in synch with it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { produce, current, enableMapSet } from 'immer';
import * as NCI from './nc-client-interop.ts';
import { ConsoleStyler } from '../common/util-prompts.ts';
import { EventMachine } from '../common/class-event-machine.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj, OpResult } from '../_types/ursys.ts';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SNA_EvtHandler = (evt: string, param: DataObj) => void;
type ActionObj = {
  op: 'update' | 'revert' | 'submit';
  propDef?: string; // 'group.prop' or just 'prop'
  value?: any; // new value for the property
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type DraftObj = {
  template: DataObj; // original settings object
  pending?: DataObj | null; // pending changes
  isDirty?: boolean; // true if there are pending changes
  changeSet?: Set<string>; // set of changed propDefs
};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('settings', 'TagCyan');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SETTINGS: DataObj = {};
const EM = new EventMachine('settings_client');

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(async () => {
  NCI.QueueHook('LOADASSETS', async () => {
    const fn = 'LOADASSETS:';
    const data = await NCI.NetCall('SRV_PSOP', { op: 'get' });
    if (data.error) throw Error(`${fn} ${data.error}`);
    if (data.settings === undefined) throw Error(`${fn} no settings found in data`);
    if (Object.keys(data.settings).length === 0)
      console.warn(`${fn} received empty settings object`, data);
    SETTINGS = data.settings;
  });
  // register for settings server push messages
  NCI.QueueMessageRegistration('CLI_PSDATA', m_ReceiveServerChanges);
})();

/// HELPER METHODS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: simple decoder for a valid dotProp string. If there is only one
 *  prop (without a dot), then it will assume it's a propName and will
 *  return [ undefined, propName ]. Otherwise it will return [groupID, propID] */
function DecodeDotProp(propDef: string) {
  if (typeof propDef !== 'string')
    throw Error(`Invalid propDef ${propDef}, expected 'group.prop'`);
  if (propDef.length === 0)
    throw Error(`Invalid propDef ${propDef}, expected 'group.prop'`);
  const [groupID, propID, ...extra] = propDef.split('.');
  if (extra.length > 0)
    throw Error(`Invalid propDef ${propDef}, expected 'group.prop'`);
  if (propID === undefined) return [undefined, groupID];
  return [groupID, propID];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: simple encoder for a valid dotProp string. If there is only one
 *  prop (without a dot), then it will return just the propName. Otherwise
 * it will return 'groupID.propID' */
function EncodeDotProp(groupID: string | undefined, propID: string): string {
  const fn = 'EncodeDotProp:';
  // single arg? then assume it's a propID
  const gidOK =
    groupID !== undefined && typeof groupID === 'string' && groupID.length > 0;
  const pidOK =
    propID !== undefined && typeof propID === 'string' && propID.length > 0;
  if (propID === undefined && gidOK) return groupID;
  // if (undefined, propID) then return propID
  if (pidOK && !gidOK) return propID;
  // got this far, ppropID should be a string
  if (!pidOK) throw Error(`${fn} bad propID ${propID}`);
  return `${groupID}.${propID}`;
}

/// DISPATCHER API ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_dispatcher = null;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: GetDispatcher creates a m_dispatcher function for use with the
 *  Dispatch method. It understands start, update, revert, and submit.
 *  This is passed to useReducer in MURSettingsEditor. The function
 *  signature of the returned function is dispatch(actionObj) => newState
 *   */
function GetDispatcher() {
  if (m_dispatcher) return m_dispatcher; // already set
  const fn = 'GetDispatcher:';
  enableMapSet(); // enable Map and Set support in immer
  m_dispatcher = produce((draft: DraftObj, action: ActionObj) => {
    const { op, propDef, value } = action;
    let group, prop;
    switch (op) {
      // update is called by individual property editors like TextInput
      case 'update':
        if (!draft.pending) {
          LOG(...PR('create pending copy'));
          draft.pending = JSON.parse(JSON.stringify(draft.template));
          draft.isDirty = false;
          draft.changeSet = new Set();
        }
        [group, prop] = DecodeDotProp(propDef);
        // groupless properties are at the top level of the template
        if (group === undefined) {
          LOG(...PR('update no group'), { prop, value });
          if (draft.pending === draft.template)
            throw Error(`${fn} pending/template are the same`);
          draft.pending[prop] = value;
          draft.changeSet.add(prop);
          draft.isDirty = true;
          const orig = current(draft).template[prop];
          const curr = current(draft).pending[prop];
          LOG(...PR(`   orig[${prop}]`, orig), `curr[${prop}]`, curr);
        }
        // grouped properties are nested in the template
        else {
          LOG(...PR('update with group'), { group, prop, value });
          if (draft.pending[group] === undefined) {
            throw Error(`${fn} invalid group referenced in ${propDef}`);
          }
          draft.pending[group][prop] = value;
          draft.changeSet.add(propDef);
          draft.isDirty = true;
        }
        break;
      // revert is called by the MURSettingsEditor Revert Changes button
      case 'revert':
        // on revert, clear pending and isDirty, no write done
        if (draft.pending) {
          LOG(...PR('revert changes', current(draft).changeSet));
          draft.pending = null;
          draft.isDirty = false;
          draft.changeSet.clear();
        } else {
          LOG(...PR('revert: no pending changes'));
          LOG(...PR('   template', current(draft).template));
        }
        break;
      // submit is called by the MURSettingsEditor Save Changes button
      case 'submit':
        // on submit, copy pending to template
        // immer handles object immutability
        if (draft.pending && draft.isDirty) {
          LOG(...PR('submit changes', current(draft).changeSet));
          draft.template = JSON.parse(JSON.stringify(draft.pending));
          draft.pending = null;
          draft.isDirty = false;
          draft.changeSet.clear();
        } else {
          LOG(...PR('submit: no pending changes'));
          LOG(...PR('   template', current(draft).template));
        }
        break;
      default:
        throw Error(`${fn} Unknown operation '${op}' for propDef ${propDef}`);
    }
    // return the modified draft object
    return draft;
  });
}

/// REACH DISPATCHER API //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_has_pending = false; // flag to indicate if there are pending changes
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: used by MURSettingsEditor useReducer, which returns [state, dispatch]
 *  during construction. The dispatch function is this one. the state
 *  that's accessible through [viewState, \]. The initial state is created
 *  in MURSettingsEditor and passed as the first argument. Subsequent
 *  changes to the state are made by calling this function with an
 *  action object that has the following properties:
 *  - op: 'update', 'revert', or 'submit'
 *  - propDef: 'group.prop' or just 'prop' if no group is used
 *  - value: the new value for the property
 *  @param state - current state to mutate
 *  @param action - { op, propDef, value }
 *  @returns new state object that useReducer will use to update the state
 *  and re-render the component.
 */
function Dispatch(state, action) {
  const immer_dispatch = GetDispatcher(); // not the same as useReducer dispatch!
  const newState = immer_dispatch(state, action);
  m_has_pending = newState.pending !== null;
  return newState;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: if there were pendinng operations from the last Dispatch call,
 *  return true */
function HasPendingChanges() {
  return m_has_pending;
}

/// SERVER INTERFACES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** handle incoming settings change from the server */
function m_ReceiveServerChanges(data: DataObj) {
  if (DBG) LOG(...PR(`client received update`), data);

  // case 1: group set of properties
  const { groupName, propObj } = data; // update group
  if (groupName && propObj) {
    const groupObj = SETTINGS[groupName];
    if (groupObj === undefined) SETTINGS[groupName] = {};
    Object.assign(SETTINGS[groupName], propObj);
    EM.emit(groupName, propObj);
    EM.emit('*', { [groupName]: propObj });
    return;
  }

  // case 2: single property update
  const { dotProp, value } = data; // update property
  if (dotProp !== undefined && value !== undefined) {
    const [gkey, pkey] = dotProp.split('.');
    if (SETTINGS[gkey] === undefined) SETTINGS[gkey] = {};
    if (SETTINGS[gkey][pkey] === undefined) SETTINGS[gkey][pkey] = {};
    Object.assign(SETTINGS[gkey][pkey], value);
    EM.emit(dotProp, value);
    EM.emit('*', { [gkey]: { [pkey]: value } });
    return;
  }

  // case 3: full settings update
  const { settings } = data; // update all settings
  if (settings !== undefined) {
    SETTINGS = Object.assign(SETTINGS, settings);
    EM.emit('*', settings);
    return;
  }

  /// case 4: nothing is set
  throw Error(`server pushed unknown data format`, data);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return either the entire settings object, or a groupKey */
function Get(groupName?: string): OpResult {
  const fn = 'Get:';
  if (typeof groupName === 'string' && groupName.length > 0) {
    if (SETTINGS[groupName] !== undefined) return SETTINGS[groupName];
    return { error: `groupName '${groupName}' not found in settings` };
  }
  return SETTINGS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: update a single property in the settings object to the server
 *  which will then push the change to all clients */
async function UpdateProperty(dotProp: string, value: any) {
  if (DBG) LOG(...PR(`client push property update`, { dotProp, value }));
  const opResult = await NCI.NetCall('SRV_PSOP', { op: 'update', dotProp, value });
  return opResult;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: update a group of properties in the settings object to the server
 *  which will then push the change to all clients */
async function UpdateGroup(groupName: string, propObj: DataObj) {
  if (DBG) LOG(...PR(`client push group update`, { groupName, propObj }));
  const opResult = await NCI.NetCall('SRV_PSOP', {
    op: 'update',
    groupName,
    propObj
  });
  return opResult;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Subscribe to setting change event. The scope is either * or a specific
 *  subkey of the settings object */
function Subscribe(scope: string = '*', evHdl: SNA_EvtHandler) {
  EM.on(scope, evHdl);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Unsubscribe from setting change event */
function Unsubscribe(scope: string = '*', evHdl: SNA_EvtHandler) {
  EM.off(scope, evHdl);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  Dispatch, // (state, action) => newState
  HasPendingChanges, // () => boolean
  DecodeDotProp,
  EncodeDotProp,
  //
  Get, // (subkey?: string) => Promise<OpResult>
  UpdateProperty, //
  UpdateGroup,
  //
  Subscribe, // (scope: string, evHdl: SNA_EvtHandler) => void
  Unsubscribe // (scope: string, evHdl: SNA_EvtHandler) => void
};
