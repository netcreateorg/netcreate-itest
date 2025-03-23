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
  if (Object.keys(set_props).length > 0) return;
  m_settings = await Settings.Get();
  Settings.Subscribe('*', data => {
    LOG(...PR('handleSettingsUpdate:', data));
  });
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {};
