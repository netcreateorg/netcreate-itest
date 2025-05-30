/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const { ConsoleStyler } = require('ursys-min');
const RSB = require('./react-settings-bridge');
const PropertyGroup = require('./MURPropertyGroup');
const { diff } = require('deep-object-diff');
const ToDoList = require('./MURSettingsToDo');

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a react context object, providing access to the values prop of the
 *  SettingsProvider. It has to be defined within the React App root */
const SettingsContext = RSB.GetSettingsContext(); // get the settings context

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MURSettingsEditor() {
  const api = RSB.useSettings();
  const [oldState, saveOldState] = React.useState(api.lastSettingsUpdate);
  const [showToDo, setShowToDo] = React.useState(true);

  function saveChanges() {
    saveOldState(api.lastSettingsUpdate);
    LOG(...PR('would save changes'));
  }

  function revertChanges() {
    LOG(...PR('would revert changes'));
  }

  // new system is no longer used for netcreate; sticking with legacy for now
  // const propDefs = RSB.GetPropertyDefs();
  // const metaDefs = RSB.GetMetaDefs();
  const { name, description } = RSB.GetLegacyTemplate();
  const propDefs = {
    graphSettings: {
      graphName: {
        type: 'string',
        value: name
      },
      graphDescription: {
        type: 'string',
        value: description
      }
    }
  };
  const metaDefs = {
    _groupMeta: {},
    graphSettings: {
      graphName: {
        label: 'Graph Name',
        tooltip: 'Name of the graph',
        placeholder: 'Graph Name'
      },
      graphDescription: {
        label: 'Graph Description',
        tooltip: 'Description of the graph',
        placeholder: 'Graph Description'
      }
    }
  };

  const { opBtnStyle, modColor } = RSB.GetStyles();

  const mod = api.lastSettingsUpdate !== oldState;
  const backgroundColor = mod ? modColor : 'white';
  const color = mod ? 'black' : 'gray';
  const btnStyle = { ...opBtnStyle, backgroundColor, color };

  return (
    <SettingsContext.Provider value={api} modified={mod}>
      <button style={btnStyle} onClick={saveChanges} disabled={!mod}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
        Revert Changes
      </button>
      <button style={btnStyle} onClick={() => setShowToDo(!showToDo)}>
        {showToDo ? 'ShowWIP' : 'ShowToDo'}
      </button>
      {!showToDo &&
        Object.keys(propDefs).map(gn => (
          <PropertyGroup
            groupDef={{ [gn]: propDefs[gn] }}
            metaDef={{ [gn]: metaDefs[gn] }}
            key={gn}
          />
        ))}
      {showToDo && ToDoList}
    </SettingsContext.Provider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
