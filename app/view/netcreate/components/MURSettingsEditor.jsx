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
  const [showToDo, setShowToDo] = React.useState(false);
  const [hasLock, setHasLock] = React.useState(!RSB.IsTemplateLocked());
  const [draft, dispatch] = React.useReducer(RSB.Dispatch, initialState);
  const value = { hasLock, draft, dispatch };
  const { globalsList, groupList } = RSB.GetUISettingsList(draft.template._ui);

  /// LOCKING ///

  React.useEffect(() => {
    LOG(...PR('MURSettingsEditor mounted'));
    RSB.LockTemplate().then(reqLockOK => {
      setHasLock(reqLockOK);
      LOG(...PR('Locking template on mount:', reqLockOK));
    });
    return () => {
      LOG(...PR('MURSettingsEditor unmounted'));
      if (hasLock) {
        RSB.ReleaseTemplate().then(reqUnlockOK => {
          if (!reqUnlockOK) {
            LOG(...PR('Failed to unlock template on unmount'));
          } else {
            LOG(...PR('Unlocked template on unmount'));
          }
        });
      }
    };
  }, []); // empty dependency array means this runs once on mount

  /// HANDLERS ///

  function revertChanges() {
    dispatch({ op: 'revert' });
  }

  function submitChanges() {
    dispatch({ op: 'submit', saveFunction: RSB.PersistTemplate });
  }

  /// RENDER PREP ///

  const { opBtnStyle, modColor } = RSB.GetStyles();
  const mod = draft.isDirty;
  const backgroundColor = mod ? modColor : 'white';
  const color = mod ? 'black' : 'gray';
  const btnStyle = { ...opBtnStyle, backgroundColor, color };

  /// RENDER ///

  // save, revert, toggle
  const ButtonBar = hasLock ? (
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
  ) : (
    <p>Template is locked by another user.</p>
  );

  // note: template global settings not grouped, so prepend as special case group=""
  const GroupList = groupList.map(gn => <PropertyGroup groupName={gn} key={gn} />);
  GroupList.unshift(<PropertyGroup groupName="" key="global-settings" />);

  //

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
