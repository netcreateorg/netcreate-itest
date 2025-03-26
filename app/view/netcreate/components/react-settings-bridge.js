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
const PR = ConsoleStyler('SettingClient', 'TagBlue');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MOD = UNISYS.NewModule(module.id);
const UDATA = UNISYS.NewDataLink(MOD);

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_key_hack = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Hacky way to generate a React key prop, which is required for rendering
 *  lists of components in an array */
function ReactListKey(prefix) {
  if (typeof prefix !== 'string') prefix = Math.random().toString(36).substring(2, 5);
  return `${prefix}${m_key_hack++}`;
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
 *  @param any value - new value for the property */
async function UpdateProperty(dotProp, value) {
  const opResult = await Settings.UpdateProperty(dotProp, value);
  if (opResult.status === 'ok') return opResult;
  throw Error(`Failed to update ${dotProp} with value ${value}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Update a group in the settings object.
 *  @param string groupName - 'group'
 *  @param object propObj - { prop: value, prop2: value2 } */
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
function DerefPropertyList(groupObj) {
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

/// SHARED STYLING OBJECTS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const padding = '0.2rem 0.4rem';
const margin = '0.2rem 0.4rem';
const border = '1px solid #cc8';
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
  zIndex: 1000,
  maxWidth: '20rem',
  display: 'none'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetStyles() {
  return { itemGrid, labelStyle, inputStyle, popupStyle };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function EventTargetOffsetStyle(event) {
  const rect = event.target.getBoundingClientRect();
  return {
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.top + window.scrollY + rect.height + 2}px`
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReactListKey,
  RLK: ReactListKey,
  //
  GetPropertyDefs,
  GetMetaDefs,
  //
  DerefPropertyList,
  DerefSingularMetaDef,
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
