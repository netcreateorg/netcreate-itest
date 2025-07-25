/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Array Input Component
  Handle a list of setting options in a variable length array

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

  console.log(
    `%cArrayInput: ${groupName}.${propName}.${propField}`,
    'color: blue',
    controlData,
    sourceMeta
  );

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

    // handle special control types
    if (_control === 'in_color') {
      return (
        <div
          key={itemKey}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem'
          }}
        >
          <input
            type="color"
            value={item.color || '#000000'}
            disabled={isDisabled}
            style={{
              width: '40px',
              height: '30px',
              border: '1px solid #ccc',
              borderRadius: '3px'
            }}
            onChange={e => {
              // TODO: dispatch color change to item.color
              console.log(`Color change for ${itemPropDef}.color:`, e.target.value);
            }}
          />
          <input
            type="text"
            value={item.label || ''}
            disabled={isDisabled}
            placeholder="Label"
            style={{ ...inputStyle, minWidth: '120px' }}
            onChange={e => {
              // TODO: dispatch label change to item.label
              console.log(`Label change for ${itemPropDef}.label:`, e.target.value);
            }}
          />
          <button
            style={{ 
              ...opBtnStyle, 
              backgroundColor: '#ff4444', 
              color: 'white',
              fontSize: '0.8em',
              padding: '0.2rem 0.5rem',
              width: '60px'
            }}
            disabled={isDisabled}
            onClick={() => {
              // TODO: dispatch DELETE action
              console.log(`Delete item at ${itemPropDef}`);
            }}
          >
            DELETE
          </button>
        </div>
      );
    }
    // handle unsupported control types
    return (
      <div key={itemKey}>
        <span>{propField}: </span>
        <span style={{ color: 'gray' }}>[{_control}]</span>
      </div>
    );
  });

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #ddd'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label>SORT:</label>
          <select
            style={inputStyle}
            disabled={isDisabled}
            defaultValue="a-z"
            onChange={e => {
              // TODO: dispatch SORT action
              console.log(`Sort ${propDef} by:`, e.target.value);
            }}
          >
            <option value="a-z">A-Z</option>
            <option value="z-a">Z-A</option>
          </select>
        </div>
        <button
          style={{ 
            ...opBtnStyle, 
            backgroundColor: '#4CAF50', 
            color: 'white',
            fontSize: '0.8em',
            padding: '0.2rem 0.5rem',
            width: '60px',
            marginRight: '1rem'
          }}
          disabled={isDisabled}
          onClick={() => {
            // TODO: dispatch ADD action
            console.log(`Add new item to ${propDef}`);
          }}
        >
          ADD
        </button>
      </div>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ArrayInput;
