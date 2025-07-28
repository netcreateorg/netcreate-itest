/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Array Input Component
  Handle a list of setting options in a variable length array
  for arrays that contains simple controls

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
import BooleanInput from './MURBooleanInput';
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InText', 'TagBlue');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { labelStyle, inputStyle, opBtnStyle, modColor } = RSB.GetStyles();

const arrayItemStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 100px 40px',
  gap: '0.5rem',
  alignItems: 'center',
  padding: '0.5rem',
  border: '1px solid #ccc',
  marginBottom: '0.5rem',
  backgroundColor: '#f9f9f9'
};

const arrayContainerStyle = {
  border: '1px solid #ddd',
  padding: '1rem',
  backgroundColor: '#fff'
};

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ExtractArrayProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName, propField } = controlData;
  const { sourceMeta, sourceData, itemDef } = controlData;

  if (!Array.isArray(sourceData)) return { error: 'sourceData must be an array' };

  if (!itemDef || typeof itemDef !== 'object')
    return { error: 'itemDef must be an object defining field types' };

  return {
    groupName,
    propName,
    propField,
    sourceData,
    itemDef,
    sourceMeta
  };
}

/// ARRAY INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders an array of UI Objects */
function ArrayInput(props) {
  const { propDef } = props;
  const { draft, hasLock } = React.useContext(RSB.SettingsContext);

  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const arrayProps = m_ExtractArrayProps(controlData);

  if (arrayProps.error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>Error: {arrayProps.error}</div>
    );
  }

  const { groupName, propName, propField } = arrayProps;
  const { sourceMeta, sourceData, itemDef } = arrayProps;
  const isDisabled = !hasLock;

  const { _control } = itemDef;
  // Render child inputs for each item in the array
  const ItemControls = sourceData.map((item, index) => {
    const itemKey = `item-${index}`;
    const itemPropDef = `${propDef}[${index}]`;

    // handle common control types
    if (_control === 'in_string' || _control === 'in_text') {
      return <TextInput propDef={itemPropDef} key={childKey} />;
    } else if (_control === 'in_boolean') {
      return <BooleanInput propDef={itemPropDef} key={childKey} />;
    }

    // handle unsupported control types
    return (
      <div key={itemKey}>
        <span>{propField}: </span>
        <span style={{ color: 'gray' }}>[{_control}]</span>
      </div>
    );
  });

  /// RENDER ///

  return (
    <div style={arrayContainerStyle}>
      {sourceMeta.label && (
        <div style={{ marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, fontWeight: 'bold' }}>{sourceMeta.label}</h4>
        </div>
      )}
      {sourceMeta.help && (
        <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9em' }}>
          {sourceMeta.help}
        </div>
      )}
      {ItemControls}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ArrayInput;
