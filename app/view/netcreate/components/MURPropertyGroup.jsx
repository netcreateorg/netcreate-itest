/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('PGroup', 'TagBlue');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { label } = props;
  return (
    <span>
      <b>{label}</b>
    </span>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A PropertyGroup component that displays a group of properties, having
 *  received groupName */
function PropertyGroup(props) {
  const groupName = props.groupName || ''; // e.g. 'graphSettings'
  const { draft } = React.useContext(RSB.SettingsContext);
  const uiData = draft.template._ui || {};

  // editable properties are in propsData and propNames
  // which are derived by scanning uiData which is the metadata
  // dictionary that determines what the UI should display

  let propNames; // array of property names to display
  let propsData = {}; // related

  // handle a blank groupName as the special case where all the
  // ungrouped settings in the TEMPLATE are considered "globalsList"
  if (groupName === '') {
    propNames = RSB.GetUISettingsList(uiData).globalsList || [];
    propNames.forEach(p => (propsData[p] = uiData[p]));
    propsData._src = '';
    if (uiData._editor && uiData._editor.global) {
      propsData._editor = uiData._editor.global;
    } else {
      propsData._editor = { label: '<editor global>', description: '' };
    }
  }
  // for all other groups, just copy the uiData into propsData
  else {
    propsData = uiData[groupName] || {};
    propsData._src = groupName;
    propNames = Object.keys(uobj).filter(RSB.IsUIGroup(uobj));
  }

  // look for title in propsData or _editor.global
  const metadata = propsData[groupName] || propsData._editor || {};
  const grpTitle = metadata.label || groupName.toUpperCase() || '<title not set>';
  const grpDesc = metadata.description || '';
  const key = `pg-${groupName}`;

  /// RENDER ///

  return (
    <div key={key} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader label={grpTitle} />
        </summary>
        {grpDesc && <p style={{ color: 'gray', fontStyle: 'italic' }}>{grpDesc}</p>}
        {propNames.map(p => {
          const propDef = RSB.EncodeDotProp(groupName, p);
          const inputKey = `in-${propDef}`;
          return <TextInput propDef={propDef} key={inputKey} />;
        })}
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
