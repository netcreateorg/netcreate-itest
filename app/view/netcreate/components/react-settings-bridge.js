/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  React Settings Bridge
  bridges the difference legacy netcreate modules and new settings manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const UNISYS = require('unisys/client');
const DATASTORE = require('system/datastore');

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
/** API HELPER: splits a dotProp string into groupName and propName */
function DecodeDotProp(dotProp) {
  return Settings.DecodeDotProp(dotProp);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: create a dotProp string from groupName and propName */
function EncodeDotProp(groupName, propName) {
  return Settings.EncodeDotProp(groupName, propName);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: Given a settings object and dotProp, return all UI-relevant
 *  data. The settings object could be TEMPLATE or from React Context value.
 *  Since this is a legacy codebase, we don't have access to ?. operators */
function DecodeUIData(setObj, dotProp) {
  const fn = 'DecodeUIData:';
  if (typeof setObj !== 'object') throw Error(`${fn} arg1 must be a settings object`);
  if (typeof dotProp !== 'string') throw Error(`${fn} arg2 must be a dotProp string`);
  const [groupName, propName] = DecodeDotProp(dotProp); // throws error if not valid
  // determine value stored in the settings object
  const setUI = setObj._ui;
  let value;
  let uiData;
  if (groupName === undefined) {
    // case 1: no groupName, just propName
    value = setObj[propName];
    if (value === undefined) return { value, error: `no value for ${dotProp}` };
    if (!setUI || !setUI[propName])
      return { groupName, propName, value, error: `no UI data for ${dotProp}` };
    uiData = setUI[propName];
    return { value, ...uiData };
  } else {
    // case 2: groupName and propName
    if (
      setObj[groupName] === undefined ||
      setObj[groupName][propName] === undefined
    ) {
      return { value: undefined, error: `no value for ${dotProp}` };
    }
    value = setObj[groupName][propName];
    if (!setUI || !setUI[groupName] || !setUI[groupName][propName]) {
      return { groupName, propName, value, error: `no UI data for ${dotProp}` };
    }
    uiData = setUI[groupName][propName];
    return { groupName, propName, value, ...uiData };
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: determine if passed object is a ui object which has a type */
function IsUIObj(uobj) {
  // either a property or property in a group
  if (uobj === undefined || typeof uobj !== 'object')
    throw Error('uobj must be an object');
  return typeof uobj.type === 'string';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: determine if passed object is a ui group which has properties */
function IsUIGroup(uobj) {
  // a group is an object with properties, not a property itself
  if (uobj === undefined || typeof uobj !== 'object')
    throw Error('uobj must be an object');
  if (Object.keys(uobj).length === 0) return false; // empty group
  if (uobj.type !== undefined) return false; // not a group, it's a property
  // got this far so it's probably a valid group
  return Object.keys(uobj).some(key => IsUIObj(uobj[key]));
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API HELPER: Given a uiData object, return a list of global settings and
 *  a list of groups found without further decoding the group properties */
function GetUISettingsList(uiData) {
  if (uiData === undefined || typeof uiData !== 'object')
    return { error: 'uiData is not anobject' };
  if (Object.keys(uiData).length === 0)
    return { globalsList: [], groupList: [], error: 'uiData is empty' };
  const globalsList = [];
  const groupList = [];
  Object.keys(uiData).forEach(g => {
    const entry = uiData[g];
    if (IsUIObj(entry)) globalsList.push(g);
    else if (IsUIGroup(entry)) groupList.push(g);
  });
  return { globalsList, groupList };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Check if there are any pending changes in the settings object. */
function HasPendingChanges() {
  // Check if there are any pending changes in the settings
  return Settings.HasPendingChanges();
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
  gridTemplateColumns: 'minmax(200px,max-content) auto',
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
    top: `${rect.top + window.scrollY + rect.height + 2}px`
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
  DecodeUIData, // setObj, dotProp => { value, ...uiData }
  GetUISettingsList, // uiData => { globalsList, groupSettings }
  HasPendingChanges, // return true if there are pending changes
  DecodeDotProp, // 'group.prop' => { groupName, propName }
  EncodeDotProp, // { groupName, propName } => 'group.prop'
  IsUIObj, // uobj => true if it has a type
  IsUIGroup, // uobj => true if it has properties
  // Styling API
  GetStyles,
  EventTargetOffsetStyle,
  //
  Subscribe,
  Unsubscribe
};
