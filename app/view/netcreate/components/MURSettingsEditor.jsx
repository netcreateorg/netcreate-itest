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
const PR = ConsoleStyler('MURSetEd', 'TagBlue');
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
  const [showToDo, setShowToDo] = React.useState(true);
  //
  m_viewstate = RSB.GetViewState();
  const [viewState, dispatch] = React.useReducer(
    RSB.DispatchViewStateChange,
    m_viewstate
  );

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

  // new system is no longer used for netcreate; sticking with legacy for now
  // const propDefs = RSB.GetPropertyDefs();
  // const metaDefs = RSB.GetMetaDefs();
  const propDefs = m_MakePropDefs(RSB.GetLegacyTemplate());
  const metaDefs = {
    _groupMeta: {},
    graphSettings: {
      name: {
        label: 'Graph Name',
        tooltip: 'Name of the graph',
        placeholder: 'Graph Name'
      },
      description: {
        label: 'Graph Description',
        tooltip: 'Description of the graph',
        placeholder: 'Graph Description'
      }
    }
  };

  const { opBtnStyle, modColor } = RSB.GetStyles();
  const mod = RSB.HasPendingChanges();
  const backgroundColor = mod ? modColor : 'white';
  const color = mod ? 'black' : 'gray';
  const btnStyle = { ...opBtnStyle, backgroundColor, color };

  /// RENDER ///

  return (
    <SettingsContext.Provider>
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
