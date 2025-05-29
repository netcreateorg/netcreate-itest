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

  function saveChanges() {
    saveOldState(api.lastSettingsUpdate);
    LOG(...PR('would save changes'));
  }

  function revertChanges() {
    LOG(...PR('would revert changes'));
  }

  const propDefs = RSB.GetPropertyDefs();
  const metaDefs = RSB.GetMetaDefs();
  const { opBtnStyle, modColor } = RSB.GetStyles();

  const mod = api.lastSettingsUpdate !== oldState;
  const backgroundColor = mod ? modColor : 'white';
  const btnStyle = { ...opBtnStyle, backgroundColor };

  return (
    <SettingsContext.Provider value={api} modified={mod}>
      <button style={btnStyle} onClick={saveChanges} disabled={!mod}>
        Save Changes
      </button>
      &nbsp;
      <button style={btnStyle} onClick={revertChanges} disabled={!mod}>
        Revert Changes
      </button>
      {/* {Object.keys(propDefs).map(gn => (
        <PropertyGroup
          groupDef={{ [gn]: propDefs[gn] }}
          metaDef={{ [gn]: metaDefs[gn] }}
          key={gn}
        />
      ))} */}
      <div>
        <ul>
          <li>graph name</li>
          <li>graph description</li>
          <li>secret key (for tokens)</li>
          <li>admin password</li>
          <li>
            Node Definitions
            <ul>
              <li>
                Node Type
                <ul>
                  <li>1: [label, color]</li>
                  <li>2: [label, color]</li>
                  <li>...7</li>
                </ul>
              </li>
              <li>Notes -- label, type, hide</li>
              <li>Info -- label, type, hide</li>
              <li>InfoSource -- label, type, hide</li>
            </ul>
          </li>
          <li>
            Edge Definitions
            <ul>
              <li>
                Edge Type
                <ul>
                  <li>1: [label, color]</li>
                  <li>2: [label, color]</li>
                  <li>...7</li>
                </ul>
              </li>
              <li>Notes -- label, type, hide</li>
              <li>InfoOrigin -- label, type, hide</li>
              <li>Citation -- label, type, hide</li>
              <li>Category -- label, type, hide</li>
            </ul>
          </li>
          <li>
            Comment Types
            <ul>
              <li>slug</li>
              <li>label</li>
              <li>
                prompts
                <ul>
                  <li>1: [format, prompt, help, feedback]</li>
                  <li>2: [format, prompt, help, feedback]</li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
        <p>NOTES: </p>
        <ul>
          <li>
            `isProvenance` will place a field in the Proveannce tab. But we do not
            expect teachers to need to change that.
          </li>
        </ul>
      </div>
    </SettingsContext.Provider>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingsEditor;
