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
 *  @param string propDef - 'group', 'group.prop', or '*' for all changes
 *  @param function changeHandler - (propDef, eventObj) => {} */
function Subscribe(propDef, changeHandler) {
  Settings.Subscribe(propDef, changeHandler);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Subscribe to changes in the settings object
 *  @param string propDef - 'group', 'group.prop', or '*' for all changes
 *  @param function changeHandler - (propDef, eventObj) => {} */
function Unsubscribe(propDef, changeHandler) {
  Settings.Unsubscribe(propDef, changeHandler);
}

/// REACT SETTINGS API ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: PropertyDefs define the type and default value of a property, but not
 *  the value itself. */
function GetPropertyDefs() {
  return Settings.Get('PropertyDefs');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: LayoutDefs define metadata for a property's UI representation */
function GetLayoutDefs() {
  return Settings.Get('LayoutDefs');
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReactListKey,
  GetPropertyDefs,
  GetLayoutDefs,
  //
  UpdateProperty,
  UpdateGroup,
  //
  Subscribe,
  Unsubscribe
};
