/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Array Input Component
  Handle a list of setting options in a variable length array

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
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

  const { groupName, propName, propField, sourceMeta, sourceData, itemDef } =
    controlData;

  if (!Array.isArray(sourceData)) return { error: 'sourceData must be an array' };

  if (!itemDef || typeof itemDef !== 'object')
    return { error: 'itemDef must be an object defining field types' };

  return {
    groupName,
    propName,
    propField,
    items: sourceData,
    schema: itemDef,
    metadata: sourceMeta
  };
}

/// ARRAY INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders an array of UI Objects */
function ArrayInput(props) {
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);

  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const arrayProps = m_ExtractArrayProps(controlData);

  if (arrayProps.error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>Error: {arrayProps.error}</div>
    );
  }

  const { groupName, propName, propField } = arrayProps;
  const { items, schema, metadata } = arrayProps;
  const isDisabled = !hasLock;

  console.log(
    `%cArrayInput: ${groupName}.${propName}.${propField}`,
    'color: blue',
    controlData
  );

  return <p style={{ color: 'red' }}>Would render ArrayInput</p>;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ArrayInput;
