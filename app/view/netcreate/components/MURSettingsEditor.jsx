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
  GetContext
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
const SettingsContext = GetContext(); // get the settings context

/// CUSTOM HOOK FOR SETTINGS CONTEXT //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React Hook to manage settings context */
function useSettings(initialSettings = {}) {
  //
  const [needsUpdate, triggerUpdate] = React.useState({ init: '' });

  /** universal get settings */
  const get = dotProp => Settings.Get(dotProp);

  /** update property via settings manager, then trigger rerender */
  const updateProperty = async (dotProp, value) => {
    const opResult = await Settings.UpdateProperty(dotProp, value);
    const { error, changed } = opResult;
    if (error) {
      console.error(`updateProperty: ${error}`);
      return false; // indicate failure
    }
    triggerUpdate(opResult); // trigger a rerender
    return true;
  };

  /** update group of properties via settings manager, then trigger rerender */
  const updateGroup = async (groupName, propObj) => {
    const opResult = await Settings.UpdateGroup(groupName, propObj);
    const { error, changed } = opResult;
    if (error) {
      console.error(`updateGroup: ${error}`);
      return false;
    }
    triggerUpdate(opResult); // trigger a rerender
    return true;
  };

  return {
    // to trigger rerender
    needsUpdate,
    // api
    get,
    updateProperty,
    updateGroup
  };
}

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
    <SettingsContext.Provider value={api}>
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
