/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NC SETTINGS CLIENTS

  This is a NetCreate specific module that is designed to work with
  react-settings-bridge.js. 
  
  This module uses React conventions. We are forced to use React hooks
  like useReducer and useContext to manage state within components useState and
  useEffect to trigger rerenders; React simply isn't designed to be used with
  more straightforward top-down data flow like a mature framework.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { produce, current, enableMapSet } from 'immer';
import { ConsoleStyler } from '../common/util-prompts.ts';
import { EventMachine } from '../common/class-event-machine.ts';
import { IsInteger } from '../common/util-data-check.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj, OpResult } from '../_types/ursys.ts';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SNA_EvtHandler = (evt: string, param: DataObj) => void;
type ActionObj = {
  op: 'update' | 'revert' | 'submit';
  propDef?: string; // 'group.prop' or just 'prop'
  value?: any; // new value for the property
  saveFunction?: (data: DataObj) => OpResult; // optional save function
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type DraftObj = {
  template: DataObj; // original settings object
  pending?: DataObj | null; // pending changes
  isDirty?: boolean; // true if there are pending changes
  changeSet?: Set<string>; // set of changed propDefs
};
type DecodedArrayProp = {
  type?: 'array' | 'arrayIndex' | '';
  name?: string; // property name without brackets
  index?: number; // index if type is 'arrayIndex'
  error?: string; // error message if malformed
};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('settings', 'TagCyan');
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EM = new EventMachine('settings_client');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: looks for bracket expression either [] or [n] at the end of the
 *  string, return typeof 'array' or 'arrayIndex' */
function u_DecodeArrayProp(propSeg: string): DecodedArrayProp {
  const fn = 'u_decodeArrayProp:';
  // quit if this doesn't look like an array
  if (propSeg[propSeg.length - 1] !== ']') return { type: '', name: propSeg };
  const match = propSeg.match(/^(.*)\[(\d*)\]$/);
  if (match) {
    if (match[2])
      return { type: 'arrayIndex', name: match[1], index: parseInt(match[2]) };
    return { type: 'array', name: match[1] };
  }
  // if it doesn't match, then it's a malformed array prop
  return { error: `${fn} Malformed array prop ${propSeg}` };
}

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: simple decoder for a valid propDef string. If there is only one
 *  prop (without a dot), then it will assume it's a propName and will
 *  return [ undefined, propName ]. Otherwise it will return [groupID, propID]
 *  or [groupID, propID, fieldID */
function DecodePropDef(propDef: string) {
  // guard checks
  if (typeof propDef !== 'string')
    throw Error(`Invalid propDef ${propDef}, expected dotted string`);
  if (propDef.length === 0)
    throw Error(`Invalid propDef ${propDef}, expected dotted string`);
  const [groupID, propID, fieldID, ...extra] = propDef.split('.');
  if (extra.length > 0)
    throw Error(`Invalid propDef ${propDef}, expected 'group.prop'`);
  // check that none of the parts are purely numeric
  if (IsInteger(groupID) || IsInteger(propID) || IsInteger(fieldID)) {
    throw Error(`Invalid propDef ${propDef}, numeric parts not allowed`);
  }
  // if there is only one part, then it's a propID
  if (propID === undefined) {
    const { type, index } = u_DecodeArrayProp(groupID);
    if (type === 'arrayIndex') return [undefined, groupID, undefined, index];
    return [undefined, groupID, undefined];
  }
  // if there are two or more parts, then check the last defined part for
  // array-ness
  const lastProp = fieldID || propID || groupID;
  const { type, index } = u_DecodeArrayProp(lastProp);
  if (type === 'arrayIndex') return [groupID, propID, fieldID, index];
  return [groupID, propID, fieldID];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: simple encoder for a valid propDef string. If there is only one
 *  prop (without a dot), then it will return just the propName. Otherwise
 * it will return 'groupID.propID' or 'groupID.propID.fieldID' */
function EncodePropDef(
  groupID: string | undefined,
  propID: string,
  fieldID?: string | undefined,
  index?: number | undefined
): string {
  const fn = 'EncodePropDef:';

  // guard checks
  const gidOK =
    groupID !== undefined && typeof groupID === 'string' && groupID.length > 0;
  const pidOK =
    propID !== undefined && typeof propID === 'string' && propID.length > 0;
  const fldOK =
    fieldID !== undefined && typeof fieldID === 'string' && fieldID.length > 0;
  const idxOK = index !== undefined && IsInteger(index);

  // if just groupID, this is actually a propID without a group
  if (gidOK && !pidOK) return idxOK ? `${groupID}[${index}]` : groupID;
  // if (undefined, propID) then return propID (callee may unexpectedly use this)
  if (!gidOK && pidOK) return idxOK ? `${propID}[${index}]` : propID;
  // missing groupID and propID is an error!
  if (!gidOK && !pidOK)
    throw Error(`${fn} bad groupID ${groupID} or propID ${propID}`);
  // got this far, so we have a valid groupID and propID so check fieldID
  if (fldOK) {
    return idxOK
      ? `${groupID}.${propID}.${fieldID}[${index}]`
      : `${groupID}.${propID}.${fieldID}`;
  }
  // otherwise it's a boring groupID.propID
  return idxOK ? `${groupID}.${propID}[${index}]` : `${groupID}.${propID}`;
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
    const { op, propDef, value, saveFunction } = action;
    let group, prop, field, index;

    /// UPDATE OP ///

    if (op === 'update') {
      if (!draft.pending) {
        if (DBG) LOG(...PR('create pending copy'));
        draft.pending = JSON.parse(JSON.stringify(draft.template));
        draft.isDirty = false;
        draft.changeSet = new Set();
      }
      [group, prop, field, index] = DecodePropDef(propDef);
      const isArray = index !== undefined;
      // NOTE: u_ResolveProp(dataObj, metaObj, group, prop, field) => { metadata, data, error } could go here and replace decode logic
      // groupless properties are at the top level of the template
      if (group === undefined) {
        if (DBG) LOG(...PR('update no group'), { prop, value });
        if (draft.pending === draft.template)
          throw Error(`${fn} pending/template are the same`);
        if (isArray) {
          const orig = current(draft).template[prop][index];
          const curr = current(draft).pending[prop][index];
          if (curr !== value) {
            draft.pending[prop][index] = value;
            draft.changeSet.add(prop);
            draft.isDirty = value !== orig;
          } else if (DBG) LOG(...PR('- no change for', prop));
        } else {
          const orig = current(draft).template[prop];
          const curr = current(draft).pending[prop];
          if (curr !== value) {
            draft.pending[prop] = value;
            draft.changeSet.add(prop);
            draft.isDirty = value !== orig;
          } else if (DBG) LOG(...PR('- no change for', prop));
        }
      }
      // three-level properties for composite field updates (group.prop.field)
      else if (field !== undefined) {
        if (DBG) LOG(...PR('update composite field'), { group, prop, field, value });
        if (draft.pending[group] === undefined) {
          throw Error(`${fn} invalid group referenced in ${propDef}`);
        }
        if (draft.pending[group][prop] === undefined) {
          throw Error(`${fn} invalid prop referenced in ${propDef}`);
        }
        if (isArray) {
          const orig = current(draft).template[group][prop][field][index];
          const curr = current(draft).pending[group][prop][field][index];
          if (curr !== value) {
            draft.pending[group][prop][field][index] = value;
            draft.changeSet.add(propDef);
            draft.isDirty = value !== orig;
          } else if (DBG) LOG(...PR('- no change for', propDef));
        } else {
          const orig = current(draft).template[group][prop][field];
          const curr = current(draft).pending[group][prop][field];
          if (curr !== value) {
            draft.pending[group][prop][field] = value;
            draft.changeSet.add(propDef);
            draft.isDirty = value !== orig;
          } else if (DBG) LOG(...PR('- no change for', propDef));
        }
      }
      // two-level grouped properties are nested in the template
      else {
        if (DBG) LOG(...PR('update with group'), { group, prop, value });
        if (draft.pending[group] === undefined) {
          throw Error(`${fn} invalid group referenced in ${propDef}`);
        }
        if (isArray) {
          const orig = current(draft).template[group][prop][index];
          const curr = current(draft).pending[group][prop][index];
          if (curr !== value) {
            draft.pending[group][prop][index] = value;
            draft.changeSet.add(propDef);
            draft.isDirty = value !== orig;
          } else if (DBG) LOG(...PR('- no change for', propDef));
        } else {
          const orig = current(draft).template[group][prop];
          const curr = current(draft).pending[group][prop];
          if (curr !== value) {
            draft.pending[group][prop] = value;
            draft.changeSet.add(propDef);
            draft.isDirty = value !== orig;
          } else if (DBG) LOG(...PR('- no change for', propDef));
        }
      }
      return draft;
    }

    /// REVERT OP ///

    if (op === 'revert') {
      // on revert, clear pending and isDirty, no write done
      if (draft.pending) {
        if (DBG) LOG(...PR('revert changes', current(draft).changeSet));
        draft.pending = null;
        draft.isDirty = false;
        draft.changeSet.clear();
      } else {
        if (DBG) LOG(...PR('revert: no pending changes'));
        if (DBG) LOG(...PR('- template', current(draft).template));
      }
      return draft;
    }

    /// SUBMIT OP ///

    if (op === 'submit') {
      if (typeof saveFunction !== 'function') {
        throw Error(`${fn} no saveFunction provided for submit`);
      }
      // on submit, copy pending to template
      // immer handles object immutability
      if (draft.pending && draft.isDirty) {
        if (DBG) LOG(...PR('submit changes', current(draft).changeSet));
        draft.template = JSON.parse(JSON.stringify(draft.pending));
        draft.pending = null;
        draft.isDirty = false;
        draft.changeSet.clear();
        // invoke save function passed in the action
        saveFunction(current(draft).template)
          .then((result: OpResult) => {
            if (result.OK) {
              if (DBG) LOG(...PR('submit: success', result));
            } else if (DBG) LOG(...PR('submit: error', result));
          })
          .catch(err => {
            if (DBG) LOG(...PR('submit: error', err));
          });
      } else {
        if (DBG) LOG(...PR('submit: no pending changes'));
        if (DBG) LOG(...PR('- template', current(draft).template));
      }
      return draft;
    }

    /// UNKNOWN OP ///

    throw Error(`${fn} Unknown operation '${op}' for propDef ${propDef}`);
    // return the modified draft object
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
  DecodePropDef,
  EncodePropDef,
  //
  Subscribe, // (scope: string, evHdl: SNA_EvtHandler) => void
  Unsubscribe // (scope: string, evHdl: SNA_EvtHandler) => void
};
