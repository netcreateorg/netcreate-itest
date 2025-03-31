/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { Settings, ConsoleStyler } = require('ursys-min');
const {
  GetPropertyDefs,
  FlattenPropertyDefs,
  GetMetaDefs,
  GetStyles,
  OnValueChanged,
  OffValueChanged
} = require('./react-settings-bridge');
const PropertyGroup = require('./MURPropertyGroup');
const { diff } = require('deep-object-diff');
const { SettingsProvider, useSettings } = require('./MURSettingsProvider'); // import the provider

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);

/// FUNCTIONAL COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a settings ui for rendering inside a React component */
function GeneratePropList(propDefs, metadata) {
  const groupUI = [];
  Object.keys(propDefs).forEach(gn => {
    groupUI.push(
      <PropertyGroup
        groupDef={{ [gn]: propDefs[gn] }}
        metadata={{ [gn]: metadata[gn] }}
        key={gn}
      />
    );
  });
  return groupUI;
}

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MURSettingsEditor(props) {
  const settings = Settings.Get(); // get the initial settings
  const settingsAPI = useSettings(settings);
  LOG(...PR(settingsAPI));

  function saveChanges() {}
  function revertChanges() {}

  const propDefs = GetPropertyDefs();
  const metaDefs = GetMetaDefs();
  const propsUI = GeneratePropList(propDefs, metaDefs);
  const { opBtnStyle, modColor } = GetStyles();

  const mod = false;
  const backgroundColor = mod ? modColor : 'white';
  const btnStyle = { ...opBtnStyle, backgroundColor };

  return (
    <SettingsProvider settings={settingsAPI}>
      <button style={btnStyle} onClick={saveChanges} disabled={!mod}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
        Revert Changes
      </button>
      {propsUI}
    </SettingsProvider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
