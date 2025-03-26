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
async function UpdateProperty(dotProp, value) {
  const opResult = await Settings.UpdateProperty(dotProp, value);
  if (opResult.status === 'ok') return opResult;
  throw Error(`Failed to update ${dotProp} with value ${value}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Update a group of properties in the settings object */
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
  UpdateGroup
};
