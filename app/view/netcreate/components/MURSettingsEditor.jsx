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
const PR = ConsoleStyler('MURSetEd', 'TagBlue');
const LOG = console.log.bind(console);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_old_template;

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
  // the change object should be recreated on every change to force a re-render
  const [template, setTemplate] = React.useState(RSB.GetLegacyTemplate());
  const [changes, setChanges] = React.useState({});
  const [propDefs, setPropDefs] = React.useState(m_MakePropDefs(template));

  React.useEffect(() => {
    LOG(...PR('MURSettingsEditor mounted'));
    RSB.SubscribeLegacyTemplateChanges(handleTemplateChange);
    m_old_template = RSB.GetLegacyTemplate();
    setTemplate({ ...m_old_template });
    return () => {
      LOG(...PR('MURSettingsEditor unmounted'));
      RSB.UnsubscribeLegacyTemplateChanges(handleTemplateChange);
    };
  }, []);

  function saveChanges() {
    LOG(...PR('would call RSB.SaveLegacyTemplate()'));
    // expecting that a template-wide update message will be received
    // elsewhere
  }

  function revertChanges() {
    LOG(...PR('Reverting changes to old template'), m_old_template);
    setPropDefs(m_MakePropDefs(m_old_template));
    setChanges({});
  }

  function handleTemplateChange(changeObj) {
    LOG(...PR('Legacy template changed'), changeObj);
    setChanges({ ...changes, ...changeObj });
  }

  // new system is no longer used for netcreate; sticking with legacy for now
  // const propDefs = RSB.GetPropertyDefs();
  // const metaDefs = RSB.GetMetaDefs();
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
  const mod = Object.keys(changes).length > 0;
  const backgroundColor = mod ? modColor : 'white';
  const color = mod ? 'black' : 'gray';
  const btnStyle = { ...opBtnStyle, backgroundColor, color };

  /// RENDER ///
  LOG(...PR('Rendering MURSettingsEditor props', propDefs, changes));

  return (
    <div id="--MURSettingsEditor">
      <button style={btnStyle} onClick={saveChanges} disabled={!changes}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={revertChanges} disabled={!changes}>
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
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
