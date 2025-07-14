/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  React Settings Bridge
  bridges the difference legacy netcreate modules and typescript modules
  in the MUR subsystem (part of our long-term migration strategy)

  TEMPLATE API

  In NetCreate, AppState('TEMPLATE') is a settings object that is persisted
  to disk. It is more than just a template, despite its name. It also contains
  various definitions for UI and data construction.

  STYLING OBJECTS

  Provides css-in-js styling objects for use in the MUR components that have
  been converted to (ugh) React

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const UNISYS = require('unisys/client');
const DATASTORE = require('system/datastore');
const LOCKMGR = require('../lock-mgr');

/// RUNTIME UNISYS HOOKS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('SetBridge', 'TagBlue');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// UNISYS data system
const MOD = UNISYS.NewModule(module.id);
const UDATA = UNISYS.NewDataLink(MOD);

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** quote a string or return as-is number */
function $(strOrNum) {
  return typeof strOrNum === 'string' ? `'${strOrNum}'` : strOrNum;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extended typeof to handle arrays */
function u_typeof(obj) {
  if (Array.isArray(obj)) {
    return `array`;
  }
  return typeof obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the object is a simple value type */
const value_types = ['string', 'number', 'boolean'];
function is_valueType(obj) {
  const type = u_typeof(obj);
  return value_types.includes(type);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return by value for simple types, or clone of object for complex types */
function u_clone(obj) {
  if (is_valueType(obj)) return obj; // simple value type, return as-is
  if (Array.isArray(obj)) return [...obj]; // clone array
  if (typeof obj === 'object') return { ...obj }; // clone object
  throw Error(`u_clone: unsupported type ${u_typeof(obj)}`);
}

/// DISPATCHER API ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// REACT: This is how React components can access the value of
/// <SettingsContext.Provider value={value}> through useContext(SettingsContext)
const SettingsContext = React.createContext({ origin: 'react-settings-bridge' });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: used by MURSettingsEditor useReducer, which returns [state, dispatch]
 *  during construction. See nc-settings-client.ts for more info. Returns
 *  a new state object as required by React's useReducer. */
function Dispatch(state, action) {
  return Settings.Dispatch(state, action);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Get the current template from the UDATA AppState */
function GetTemplate() {
  const template = UDATA.AppState('TEMPLATE');
  return template;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: invokes SRV_TEMPLATE_SAVE to save template to the server. The server
 *  will send NET_TEMPLATE_UPDATE to all clients with the updated template */
function PersistTemplate(templateObj) {
  return DATASTORE.SaveTemplateFile(templateObj);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: splits a propDef string into groupName and propName */
function DecodePropDef(propDef) {
  return Settings.DecodePropDef(propDef);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: create a propDef string from groupName and propName */
function EncodePropDef(groupName, propName, propField) {
  return Settings.EncodePropDef(groupName, propName, propField);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: Given a settings object and propDef, return all UI-relevant
 *  data scoped to that propDef. This data will be specific to the type
 *  of control */
function GetDataForProp(template, propDef) {
  const fn = 'GetDataForProp:';
  if (typeof template !== 'object')
    throw Error(`${fn} arg1 must be a settings object`);
  if (typeof propDef !== 'string') throw Error(`${fn} arg2 must be a propDef string`);
  const [groupName, propName, propField] = DecodePropDef(propDef); // throws error if not valid
  // NOTE: u_ResolveProp(dataObj, metaObj, group, prop, field) => { metadata, data, error } could go here and replace decode logic
  if (typeof propName !== 'string')
    return { error: `${fn} invalid propName (string required)` };
  if (typeof template._ui !== 'object')
    return { error: `${fn} t_ui _ui is not available` };

  // got this far, we have a valid template and template._ui
  let t_ui = template._ui; // _ui is the metadata source

  /// CASE 1: NO GROUP NAME, ONLY PROP NAME AVAILABLE ///
  if (groupName === undefined || groupName === '') {
    if (!template[propName]) return { value, error: `no value for ${propDef}` };
    if (t_ui[propName] !== undefined)
      return {
        groupName,
        propName,
        sourceMeta: u_clone(t_ui[propName]),
        sourceData: template[propName]
      };
    return {
      groupName: undefined,
      propName,
      error: `no UI data for ${propDef}`
    };
  }
  /// CASE 2: THREE-LEVEL COMPOSITE FIELD (GROUP.PROP.FIELD) ///
  if (propField !== undefined) {
    if (t_ui[groupName] === undefined)
      return { error: `no UI metadata for group ${groupName}` };
    if (t_ui[groupName][propName] === undefined)
      return { error: `group ${groupName} no metadata for ${propName}` };
    if (t_ui[groupName][propName][propField] === undefined)
      return {
        error: `composite ${groupName}.${propName} no metadata for field ${propField}`
      };

    const sourceData =
      template[groupName] && template[groupName][propName]
        ? template[groupName][propName][propField]
        : undefined;

    return {
      groupName,
      propName,
      propField,
      sourceMeta: u_clone(t_ui[groupName][propName][propField]),
      sourceData
    };
  }
  /// CASE 3: TWO-LEVEL GROUP NAME AND PROP NAME AVAILABLE ///
  t_ui = t_ui[groupName][propName];
  if (t_ui === undefined)
    return {
      error: `group ${groupName} no metadata for ${propName}`
    };
  // if got this far, t_ui now has a object keys for each type of
  // "editable setting" which can have multiple properties:
  //   setting nodeDefs.id = { type, displayLabel, help, hidden, includeInGraphTooltip }
  // and each key in the id setting look like this:
  //   displayLabel = { control, labelKey, helpKey }
  return {
    groupName,
    propName,
    sourceMeta: u_clone(t_ui),
    sourceData: template[groupName][propName]
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Shallow check that this is a UI object, not group of UIObjects */
function IsUIObj(uobj) {
  // either a property or property in a group
  if (uobj === undefined || typeof uobj !== 'object')
    throw Error('uobj must be an object');
  if (typeof uobj.control !== 'string')
    throw Error('uobj.control is missing or not string');
  if (Object.keys(uobj).length === 0) return false; // empty object
  return uobj.control !== 'composite'; // not a composite control
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Shallow check that this is a UI group */
function IsUIGroup(uobj) {
  // a group is an object with properties, not a property itself
  if (uobj === undefined || typeof uobj !== 'object')
    throw Error('uobj must be an object');
  if (Object.keys(uobj).length === 0) return false; // empty group
  return uobj.control === 'composite';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: Given a uiMeta object, return a list of global settings and
 *  a list of groups found without further decoding the group properties.*/
function GetUISettingsList(uiMeta) {
  if (uiMeta === undefined || typeof uiMeta !== 'object')
    return { error: 'uiMeta is not an object' };
  if (Object.keys(uiMeta).length === 0) return { error: 'uiMeta is empty' };
  const globalsList = [];
  const groupList = [];
  const unknownList = [];
  Object.keys(uiMeta).forEach(uiKey => {
    try {
      if (uiKey.startsWith('_')) return; // skip internal keys
      const entry = uiMeta[uiKey];
      if (IsUIObj(entry)) globalsList.push(uiKey);
      else if (IsUIGroup(entry)) groupList.push(uiKey);
      else unknownList.push(`${uiKey} = ${JSON.stringify(entry)}`);
      // LOG(...PR(`GetUISettingsList: processed ${uiKey}`, entry));
    } catch (err) {
      LOG(`%c${err}`, 'color:red', `for entry '${uiKey}'`, uiMeta[uiKey]);
    }
  });
  if (DBG && unknownList.length > 0) {
    LOG(...PR(`GetUISettingsList: non-UI objs found`), unknownList);
  }
  return { globalsList, groupList, unknownList };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Check if there are any pending changes in the settings object,
 *  (the TEMPLATE AppState) which is maintained by an immer draft.
 *  This flag is is true while the dispatched state has a non-null
 *  pending property (this is a copy of TEMPLATE). */
function HasPendingChanges() {
  return Settings.HasPendingChanges();
}

/// LOCKING ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_client_has_lock = false; // true if we have a lock on the template
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Get the current lock state of the settings object, which covers
 *  more than just the template. See IsTemplateLocked() for specifics */
function GetLockState() {
  return UDATA.AppState('LOCKSTATE') || { error: 'AppState LOCKSTATE undefined' };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Check if the template should be considered "locked" based on the
 *  the flags that are set by various components in NetCreate.*/
function IsTemplateLocked(lockState = GetLockState()) {
  const { templateBeingEdited } = lockState;
  const { importActive, nodeOrEdgeBeingEdited } = lockState;
  return templateBeingEdited || importActive || nodeOrEdgeBeingEdited;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Call when opening MURSettingsEditor.LockManager sets AppState
 *  for LOCKSTATE. Return true if successful lock */
async function LockTemplate() {
  const lockState = await LOCKMGR.RequestTemplateLock();
  const { success, error, lockedBy } = lockState;
  if (error) return false;
  if (success) return true;
  throw Error('LockTemplate: unexpected lock state');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Call when closing MURSettingsEditor. Naively assume it worked, because
 *  the entire locking architecture is a mess and we don't have a way to
 *  reliably detect lock authority. */
async function ReleaseTemplate() {
  const lockState = await LOCKMGR.RequestTemplateUnlock();
  const { success, error } = lockState;
  if (error) return false;
  if (success) return true;
  throw Error('UnlockTemplate: unexpected lock state');
}

/// SETTINGS CHANGE SUBSCRIPTION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Subscribe to changes in the settings object
 *  @param string event - 'group', 'group.prop', or '*' for all changes
 *  @param function changeHandler - (propDef, eventObj) => {} */
function Subscribe(event, changeHandler) {
  Settings.Subscribe(event, changeHandler);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Subscribe to changes in the settings object
 *  @param string event - 'group', 'group.prop', or '*' for all changes
 *  @param function changeHandler - (propDef, eventObj) => {} */
function Unsubscribe(event, changeHandler) {
  Settings.Unsubscribe(event, changeHandler);
}

/// SHARED STYLING OBJECTS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const padding = '0.2rem 0.4rem';
const margin = '0.2rem 0.4rem';
const border = '1px solid #cc8';
const modColor = '#ffff00a0';
// itemGrid is for the container of a label and input
const itemGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 200px) 1fr',
  alignItems: 'baseline',
  margin
};
// styling for the label and input
const labelStyle = { paddingRight: '0.5rem' };
const inputStyle = { border, padding };
// popupStyle is for the tooltip
const popupStyle = {
  position: 'fixed',
  backgroundColor: 'gray',
  color: 'white',
  padding,
  zIndex: 10000,
  maxWidth: '20rem',
  display: 'none'
};
// opBtnStyle is for operation buttons
const opBtnStyle = {
  backgroundColor: 'white',
  border,
  padding,
  margin,
  cursor: 'pointer'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetStyles() {
  return { itemGrid, labelStyle, inputStyle, popupStyle, opBtnStyle, modColor };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function EventTargetOffsetStyle(event) {
  const rect = event.target.getBoundingClientRect();
  const advPanel = document.querySelector('#popover');
  const advRect = advPanel
    ? advPanel.getBoundingClientRect()
    : { left: '0px', top: '0px' };
  return {
    left: `${rect.left - advRect.left}px`,
    top: `${rect.top - advRect.top + rect.height + 4}px`
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // React Context
  SettingsContext, // used by MURSettingsEditor to provide Provider
  // Template Settings API
  Dispatch, // state, action
  GetTemplate, // use UDATA.AppState('TEMPLATE') to return the template
  PersistTemplate, // dataObj => { template: dataObj }
  GetDataForProp, // template, propDef => { groupName, propName, sourceMeta, sourceData }
  GetUISettingsList, // uiMeta => { globalsList, groupSettings }
  HasPendingChanges, // return true if there are pending changes
  // Locking API
  GetLockState, // ()=>AppState('LOCKSTATE')
  IsTemplateLocked, // return true if template considered "locked"
  LockTemplate, // ()=> { templateBeingEdited, importActive, nodeOrEdgeBeingEdited }
  ReleaseTemplate, // ()=> { templateBeingEdited, importActive, nodeOrEdgeBeingEdited }
  // PropDef and MetaDef helpers
  DecodePropDef, // 'group.prop' => { groupName, propName }
  EncodePropDef, // { groupName, propName } => 'group.prop'
  IsUIObj, // uobj => true if it has a type
  IsUIGroup, // uobj => true if it has properties
  // Styling API
  GetStyles,
  EventTargetOffsetStyle,
  // Use these with React useEffect mount/unmount
  Subscribe,
  Unsubscribe
};
