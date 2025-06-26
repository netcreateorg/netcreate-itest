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
  const { propLabel } = props;
  return (
    <span>
      <b>{propLabel}</b>
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
      propsData._editor = { propLabel: '<editor global>', description: '' };
    }
  }
  // for all other groups, just copy the uiData into propsData
  else {
    propsData = { ...(uiData[groupName] || draft.template[groupName] || {}) };
    LOG(...PR(`PropertyGroup: groupName=${groupName}`, propsData));
    propsData._src = groupName;
    propNames = Object.keys(propsData).filter(p => p.startsWith('_') === false);
  }

  // look for title in propsData or _editor.global
  const metadata = propsData[groupName] || propsData._editor || {};
  const grpTitle = metadata.propLabel || groupName.toUpperCase() || '<title not set>';
  const grpDesc = metadata.description || '';
  const key = `pg-${groupName}`;

  /// RENDER ///

  const PropertyList = propNames.map(p => {
    const propDef = RSB.EncodeDotProp(groupName, p);
    const inputKey = `in-${propDef}`;
    const pd = propsData[p] || {};
    const propType = pd.type || 'unknown';
    if (propType === undefined) {
      LOG(`%cpropDef=${propDef} is missing 'type' property`, 'color: red');
    }
    const propLabel = pd.propLabel || pd.displayLabel || 'unknown';
    switch (propType) {
      case 'text':
      case 'string':
        return <TextInput propDef={propDef} key={inputKey} />;
      case 'number':
      case 'integer':
      case 'boolean':
      case 'password':
      case 'select':
      case 'timestamp':
        LOG(...PR(`Rendering ${propType} for property ${p}`), pd);
        return (
          <div key={inputKey}>
            {propLabel}
            <div style={{ float: 'right' }}>[input-{propType}]</div>
          </div>
        );
      default:
        LOG(...PR(`Unsupported type ${propType} for property ${p}`));
        return <p key={inputKey}>Unsupported type: {propType}</p>;
    }
  });

  return (
    <div key={key} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader propLabel={grpTitle} />
        </summary>
        {grpDesc && <p style={{ color: 'gray', fontStyle: 'italic' }}>{grpDesc}</p>}
        {PropertyList}
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
