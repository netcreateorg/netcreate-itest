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

/// REACT SETTINGS API ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** PropertyDefs define the type and default value of a property, but not
 *  the value itself. */
function GetPropertyDefs() {
  return Settings.Get('PropertyDefs');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** LayoutDefs define metadata for a property's UI representation */
function GetLayoutDefs() {
  return Settings.Get('LayoutDefs');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Update a property in the settings object, where dotProp is a string
 *  'groupName.propertyName' */
async function Update(dotProp, value) {
  LOG(...PR('would update Settings', dotProp, value));
  return UDATA.NetCall('SRV_PSOP', { op: 'update', dotProp, value });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Update a group of properties in the settings object */
async function UpdateGroup(groupName, propObj) {
  LOG(...PR('would update group', groupName, Object.keys(propObj)));
  return UDATA.NetCall('SRV_PSOP', { op: 'update', groupName, propObj });
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReactListKey,
  GetPropertyDefs,
  GetLayoutDefs,
  //
  Update,
  UpdateGroup
};
