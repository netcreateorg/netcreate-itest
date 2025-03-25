/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Setting Client
  used by outside of the settings editor MURSettingsEditor.jsx

  currently, there isn't a n

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
let m_settings = {}; // settings object split into subkeys
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this initiates the settings from the server. the settings module
 *  manages server updates and emits notifications */
UNISYS.Hook('LOADASSETS', async () => {
  if (Object.keys(m_settings).length > 0) return;
  m_settings = await Settings.Get();
  Settings.Subscribe('*', data => {
    LOG(...PR('handleSettingsUpdate:', data));
    m_settings = data;
  });
});

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
  return m_settings.PropertyDefs || {};
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** LayoutDefs define metadata for a property's UI representation */
function GetLayoutDefs() {
  return m_settings.LayoutDefs || {};
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReactListKey,
  GetPropertyDefs,
  GetLayoutDefs
};
