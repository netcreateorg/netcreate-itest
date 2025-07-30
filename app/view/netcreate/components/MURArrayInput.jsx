/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Array Input Component
  Handle a list of setting options in a variable length array
  for arrays that contains simple controls

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const TextInput = require('./MURTextInput');
const BooleanInput = require('./MURBooleanInput');
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InArray', 'TagBlue');

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
  const { sourceMeta, sourceData } = controlData;
  const controlDef = sourceMeta._controlDef;

  if (!Array.isArray(sourceData)) return { error: 'sourceData must be an array' };

  return {
    groupName,
    propName,
    propField,
    sourceData,
    sourceMeta,
    controlDef
  };
}

/// ARRAY INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders an array of UI Objects */
function ArrayInput(props) {
  const { propDef } = props;
  const { draft, hasLock } = React.useContext(RSB.SettingsContext);

  const controlData = RSB.GetDataForProp(draft.pending || draft.template, propDef);
  const arrayProps = m_ExtractArrayProps(controlData);

  if (arrayProps.error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>Error: {arrayProps.error}</div>
    );
  }

  const { groupName, propName, propField } = arrayProps;
  const { sourceMeta, sourceData, controlDef } = arrayProps;
  const isDisabled = !hasLock;

  // Render child inputs for each item in the array
  if (sourceData.length > 0)
    console.log('good sourceData', JSON.stringify(sourceData));
  const ArrayItems = sourceData.map((item, index) => {
    const itemKey = `item-${index}`;
    const itemPropDef = `${propDef}[${index}]`;

    const itemControlData = RSB.GetDataForProp(
      draft.pending || draft.template,
      itemPropDef
    );

    if (!itemControlData || !itemControlData.sourceMeta) {
      console.warn(`No control data for item ${itemPropDef}`, itemControlData);
      return null;
    }

    const control = itemControlData.sourceMeta._control;
    if (control) {
      // console.log(`Rendering item ${itemKey}`, itemControlData);
    } else {
      console.warn(`No control value found for ${itemKey}`);
      return null;
    }
    // handle unsupported control types
    return <div key={itemKey}>{itemKey}</div>;
  });

  /// RENDER ///

  return <p>Do You Even Render, Bro</p>;

  // return (
  //   <div style={arrayContainerStyle}>
  //     {sourceMeta.label && (
  //       <div style={{ marginBottom: '0.5rem' }}>
  //         <h4 style={{ margin: 0, fontWeight: 'bold' }}>{sourceMeta.label}</h4>
  //       </div>
  //     )}
  //     {sourceMeta.help && (
  //       <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9em' }}>
  //         {sourceMeta.help}
  //       </div>
  //     )}
  //     <p>Do you even render, bro?</p>
  //   </div>
  // );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ArrayInput;
