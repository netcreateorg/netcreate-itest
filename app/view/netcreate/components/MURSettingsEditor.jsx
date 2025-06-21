/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (replacement for deprecated `NCTemplate.jsx`)

  Concept: This design assumes "Property Groups" that contain "Properties"
  in a data object, which is different than how TEMPLATE is organized.
  The MURSettingsEditor figures out what Property Groups are available,
  and writes PropertyGroup components that themselves render the specific
  Input components for each property.

  Unfortunately, React itself does not lend itself to this kind of top-
  down data sharing, so we have to jump through hoops to make it work
  through various hooks and context providers.

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

  /// HANDLERS ///

  function revertChanges() {
    dispatch({ op: 'revert' });
  }

  function submitChanges() {
    dispatch({ op: 'submit', saveFunction: RSB.PersistTemplate });
  }

  /// RENDER ///

  // save, revert, toggle
  const ButtonBar = (
    <div>
      <button style={btnStyle} onClick={submitChanges} disabled={!mod}>
        Save Changes
      </button>
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
        Revert Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={() => setShowToDo(!showToDo)}>
        {showToDo ? 'ShowWIP' : 'ShowToDo'}
      </button>
    </div>
  );

  // note: template global settings not grouped, so prepend as special case group=""
  const GroupList = groupList.map(gn => <PropertyGroup groupName={gn} key={gn} />);
  GroupList.unshift(<PropertyGroup groupName="" key="global-settings" />);

  return (
    <SettingsContext.Provider value={value}>
      {ButtonBar}
      {!showToDo && GroupList}
      {showToDo && ToDoList}
    </SettingsContext.Provider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
