/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (replacement for deprecated `NCTemplate.jsx`)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const { ConsoleStyler } = require('ursys-min');
const RSB = require('./react-settings-bridge');
// components
const CompositeGroup = require('./MURCompositeGroup');
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
  const [hasLock, setHasLock] = React.useState(!RSB.IsTemplateLocked());
  const [draft, dispatch] = React.useReducer(RSB.Dispatch, initialState);
  const value = { hasLock, draft, dispatch };

  /// LOCKING ///

  React.useEffect(() => {
    (async () => {
      if (await RSB.LockTemplate()) {
        setHasLock(true);
        LOG(...PR('Locking template on mount'));
      } else {
        setHasLock(false);
        LOG(...PR('Failed to lock template on mount'));
      }
    })();
    return () => RSB.ReleaseTemplate();
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
        Cancel Settings Changes
      </button>
      <button style={btnStyle} onClick={submitChanges} disabled={!mod}>
        Save Settings Changes
      </button>
    </div>
  ) : (
    <p style={{ color: 'red', fontWeight: 'bold' }}>
      Template is locked by another user.
    </p>
  );

  // note: template global settings not grouped, so prepend as special case group=""
  const GroupList = [
    <CompositeGroup propDef="nodeDefs" open={false} key="nodeDefs" />,
    <CompositeGroup propDef="edgeDefs" open={false} key="edgeDefs" />
    // <CompositeGroup propDef="commentTypes" open={true} key="commentTypes" />
  ];
  GroupList.unshift(<CompositeGroup propDef="" open={false} key="global-settings" />);
  // HACK there is a check for global commentTypes in MURCompositeGroup

  return (
    <SettingsContext.Provider value={value}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            padding: '0.5rem 0 0.5rem 0',
            borderBottom: '1px solid #ccc'
          }}
        >
          {ButtonBar}
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto'
          }}
        >
          {GroupList}
        </div>
      </div>
    </SettingsContext.Provider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
