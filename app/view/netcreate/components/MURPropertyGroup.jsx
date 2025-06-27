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
  const metaSource = draft.template._ui || {};

  // editable properties are in propsData and propNames
  // which are derived by scanning metaSource which is the groupmeta
  // dictionary that determines what the UI should display

  let propNames; // array of property names to display
  let propsData = {}; // related

  if (groupName === '') {
    /// CASE 1: NO GROUP NAME, ONLY PROP NAME AVAILABLE ///
    propNames = RSB.GetUISettingsList(metaSource).globalsList || [];
    propNames.forEach(p => (propsData[p] = metaSource[p]));
    propsData._src = '';
    if (metaSource._editor && metaSource._editor.global) {
      propsData._editor = metaSource._editor.global;
    } else {
      propsData._editor = { propLabel: '<editor global>', description: '' };
    }
  } else {
    /// CASE 2: GROUP NAME AND PROP NAME AVAIABLE ///
    propsData = { ...(metaSource[groupName] || draft.template[groupName] || {}) };
    LOG(...PR(`PropertyGroup: groupName=${groupName}`, propsData));
    propsData._src = groupName;
    propNames = Object.keys(propsData).filter(p => p.startsWith('_') === false);
  }

  // look for title in propsData or _editor.global
  const groupmeta = propsData[groupName] || propsData._editor || {};
  const grpTitle = groupmeta.label || groupName.toUpperCase() || '<title not set>';
  const grpDesc = groupmeta.description || '';
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
      case 'group':
        LOG(
          ...PR(
            `dereferencing error: a 'group' contains the child controls you want to render`
          ),
          pd
        );
        break;
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
