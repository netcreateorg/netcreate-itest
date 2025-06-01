/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  React Settings Bridge
  bridges the difference legacy netcreate modules and new settings manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const UNISYS = require('unisys/client');

/// RUNTIME UNISYS HOOKS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('SetBridge', 'TagBlue');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// UNISYS data system
const MOD = UNISYS.NewModule(module.id);
const UDATA = UNISYS.NewDataLink(MOD);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// REACT settings manager using Context API and Reducer Hook
const SettingsContext = React.createContext({ origin: 'react-settings-bridge' });
const m_actions = ['update', 'revert', 'undo', 'redo', 'persist'];

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** quote a string or return as-is number */
function $(strOrNum) {
  return typeof strOrNum === 'string' ? `'${strOrNum}'` : strOrNum;
}

/// LEGACY SETTINGS API ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetViewState() {
  const fn = 'GetViewState:';
  LOG(...PR(`would return view state`));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: used by MURSettingsEditor useReducer
 *  @param state - current state to mutate
 *  @param action - { type: 'update', group: 'groupName', prop: 'propName', value: newValue }
 *  @returns new state
 */
function DispatchViewStateChange(state, action) {
  const fn = 'DispatchViewStateChange:';
  const { type, group, prop, value } = action;
  if (!m_actions.includes(type)) {
    LOG(...PR(`${fn} unknown action type ${type}`));
    return state; // no change
  }
  LOG(...PR(`would perform action`, action));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasPendingChanges() {
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetLegacyTemplate() {
  return UDATA.AppState('TEMPLATE');
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

/// REACT SETTINGS API ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: PropertyDefs define the type and default value of a property, but not
 *  the value itself. */
function GetPropertyDefs() {
  return Settings.Get('PropertyDefs');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: MetaDefs define metadata for a property's UI representation */
function GetMetaDefs() {
  return Settings.Get('MetaDefs');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Update a property in the settings object.
 *  @param string dotProp - 'group.prop'
 *  @param any value - new value for the property
 */
async function UpdateProperty(dotProp, value) {
  const opResult = await Settings.UpdateProperty(dotProp, value);
  if (opResult.status === 'ok') return opResult;
  throw Error(`Failed to update ${dotProp} with value ${value}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Update a group in the settings object.
 *  @param string groupName - 'group'
 *  @param object propObj - { prop: value, prop2: value2 }
 */
async function UpdateGroup(groupName, propObj) {
  const opResult = await Settings.UpdateGroup(groupName, propObj);
  if (opResult.status === 'ok') return opResult;
  throw Error(`Failed to update group ${groupName} with properties ${propObj}`);
}

/// DECODERS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: Return the name of the single key in an object, undefined
 *  otherwise */
function GetSingularKey(obj) {
  const groupList = Object.keys(obj).filter(key => !key.startsWith('_'));
  if (groupList.length !== 1) return;
  return groupList[0];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: Dereference groupObj, returning groupName and properties list */
function DerefGroupDef(groupObj) {
  const groupName = GetSingularKey(groupObj);
  if (groupName === undefined) return { error: 'groupObj must have a single key' };
  const properties = groupObj[groupName];
  const deref = { groupName, properties };
  //
  return deref; // { groupname, properties:{[propName]:{ definition props }} }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: Dereference metaObj, returning just the properites for the */
function DerefSingularMetaDef(metaObj) {
  const groupName = GetSingularKey(metaObj);
  if (groupName === undefined) return { error: 'metaObj must have a single key' };
  const deref = metaObj[groupName];
  //
  return deref; // { metadata props }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: promote a named key as the direct value of a property,
 *  converting { group:{prop:{value:1}} } to { group: {prop:1} } for using
 *  in a settings values structure */
function FlattenPropertyDefs(propDefs, key = 'value') {
  const flat = {};
  Object.keys(propDefs).forEach(groupName => {
    flat[groupName] = {};
    const group = propDefs[groupName];
    Object.keys(group).forEach(propName => {
      const propDef = group[propName];
      flat[groupName][propName] = propDef[key];
    });
  });
  return flat;
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
  // legacy API
  SettingsContext,
  GetLegacyTemplate,
  GetViewState,
  DispatchViewStateChange,
  HasPendingChanges,
  // new API
  GetPropertyDefs,
  GetMetaDefs,
  //
  DerefGroupDef,
  DerefSingularMetaDef,
  FlattenPropertyDefs,
  //
  UpdateProperty,
  UpdateGroup,
  //
  Subscribe,
  Unsubscribe,
  //
  GetStyles,
  EventTargetOffsetStyle
};
