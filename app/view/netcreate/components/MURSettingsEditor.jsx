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
  OffValueChanged,
  useSettings,
  GetSettingsContext
} = require('./react-settings-bridge');
const PropertyGroup = require('./MURPropertyGroup');
const { diff } = require('deep-object-diff');

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a react context object, providing access to the values prop of the
 *  SettingsProvider. It has to be defined within the React App root */
const SettingsContext = GetSettingsContext(); // get the settings context

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MURSettingsEditor() {
  const api = useSettings();

  function saveChanges() {}
  function revertChanges() {}

  const propDefs = GetPropertyDefs();
  const metaDefs = GetMetaDefs();
  const { opBtnStyle, modColor } = GetStyles();

  const mod = false;
  const backgroundColor = mod ? modColor : 'white';
  const btnStyle = { ...opBtnStyle, backgroundColor };

  return (
    <SettingsContext.Provider value={api} needsUpdate={api.needsUpdate}>
      <button style={btnStyle} onClick={saveChanges} disabled={!mod}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
        Revert Changes
      </button>
      {Object.keys(propDefs).map(gn => (
        <PropertyGroup
          groupDef={{ [gn]: propDefs[gn] }}
          metaDef={{ [gn]: metaDefs[gn] }}
          key={gn}
        />
      ))}
    </SettingsContext.Provider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
