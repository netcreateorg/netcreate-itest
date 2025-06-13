/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (replacement for deprecated `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const { ConsoleStyler } = require('ursys-min');
const RSB = require('./react-settings-bridge');
// components
const PropertyGroup = require('./MURPropertyGroup');
const ToDoList = require('./MURSettingsToDo');
const { SettingsContext } = RSB; // import SettingsContext from the bridge

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SEdit', 'TagBlue');
const LOG = console.log.bind(console);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_viewstate; // initialized from RSB.GetViewState() on mount

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given the TEMPLATE object, make a MURSettings compatible propDefs object
 *  for use by the PropertyGroup component and TextInput component */
function m_MakePropDefs(template) {
  const { name, description } = template || {};
  return {
    graphSettings: {
      name: {
        type: 'string',
        value: name
      },
      description: {
        type: 'string',
        value: description
      }
    }
  };
}

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MURSettingsEditor() {
  /// HANDLERS ///

  function queueChange() {
    LOG(...PR(`would dispatch update to RSB`));
  }

  function undoChange() {
    LOG(...PR(`would dispatch undo to RSB`));
  }

  function redoChange() {
    LOG(...PR(`would dispatch redo to RSB`));
  }

  function revertChanges() {
    LOG(...PR(`would dispatch revert to RSB`));
  }

  function persistChanges() {
    LOG(...PR(`would dispatch persist to RSB`));
  }

  /// SETUP ///

  const initialState = { template: RSB.GetTemplate() };
  const [showToDo, setShowToDo] = React.useState(true);
  const [editState, dispatch] = React.useReducer(RSB.Dispatch, initialState);
  const value = { editState, dispatch };
  const { globalsList, groupList } = RSB.GetUISettingsList(editState.template._ui);

  // call RSB.DecodeUISettings

  /// RENDER PREP ///

  const { opBtnStyle, modColor } = RSB.GetStyles();
  const mod = RSB.HasPendingChanges();
  const backgroundColor = mod ? modColor : 'white';
  const color = mod ? 'black' : 'gray';
  const btnStyle = { ...opBtnStyle, backgroundColor, color };

  const GroupList = groupList.map(gn => <PropertyGroup groupName={gn} key={gn} />);
  GroupList.unshift(<PropertyGroup groupName="" key="global-settings" />); // add global editState group

  /// RENDER ///
  return (
    <SettingsContext.Provider value={value}>
      <button style={btnStyle} onClick={queueChange} disabled={!mod}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={undoChange} disabled={!mod}>
        Revert Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={() => setShowToDo(!showToDo)}>
        {showToDo ? 'ShowWIP' : 'ShowToDo'}
      </button>
      {!showToDo && GroupList}
      {showToDo && ToDoList}
    </SettingsContext.Provider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
