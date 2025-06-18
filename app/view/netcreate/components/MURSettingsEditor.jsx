/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (replacement for deprecated `NCTemplate.jsx`)

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
  /// SETUP ///

  const initialState = { template: RSB.GetTemplate() };
  const [showToDo, setShowToDo] = React.useState(true);
  const [editState, dispatch] = React.useReducer(RSB.Dispatch, initialState);
  const value = { editState, dispatch };
  const { globalsList, groupList } = RSB.GetUISettingsList(editState.template._ui);

  /// RENDER PREP ///

  const { opBtnStyle, modColor } = RSB.GetStyles();
  const mod = editState.isDirty;
  const backgroundColor = mod ? modColor : 'white';
  const color = mod ? 'black' : 'gray';
  const btnStyle = { ...opBtnStyle, backgroundColor, color };

  // any grouped properties are in groupList.mapped PropertyGroups
  const GroupList = groupList.map(gn => <PropertyGroup groupName={gn} key={gn} />);
  // the existing template doesn't use grouped properties, so we add a global group
  GroupList.unshift(<PropertyGroup groupName="" key="global-settings" />); // add global editState group

  /// HANDLERS ///

  function revertChanges() {
    dispatch({ op: 'revert' });
  }

  function submitChanges() {
    dispatch({ op: 'submit' });
  }

  /// RENDER ///
  return (
    <SettingsContext.Provider value={value}>
      <button style={btnStyle} onClick={submitChanges} disabled={!mod}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
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
