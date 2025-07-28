/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Color Input Component
  Handle a list of color options in a variable length array

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import ColorItemEdit from './MURColorItemEdit';
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InColor', 'TagBlue');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { inputStyle, opBtnStyle } = RSB.GetStyles();

const arrayContainerStyle = {
  border: '1px solid #ddd',
  padding: '1rem',
  backgroundColor: '#fff'
};

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ExtractColorArrayProps(controlData) {
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

/// COLOR INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders an array of color UI Objects */
function ColorInput(props) {
  const { propDef } = props;
  const { draft, hasLock } = React.useContext(RSB.SettingsContext);

  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const arrayProps = m_ExtractColorArrayProps(controlData);

  if (arrayProps.error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>Error: {arrayProps.error}</div>
    );
  }

  const { groupName, propName, propField } = arrayProps;
  const { sourceMeta, sourceData, itemDef } = arrayProps;
  const isDisabled = !hasLock;

  const { _control } = itemDef;

  // Render color item editors for each item in the array
  const ColorItemControls = sourceData.map((item, index) => {
    const itemKey = `color-item-${index}`;
    const itemPropDef = `${propDef}[${index}]`;

    return (
      <div
        key={itemKey}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ColorItemEdit propDef={itemPropDef} />
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
            console.log(`Delete color item at ${itemPropDef}`);
          }}
        >
          DELETE
        </button>
      </div>
    );
  });

  return (
    <div style={arrayContainerStyle}>
      {ColorItemControls}
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
            console.log(`Add new color item to ${propDef}`);
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
module.exports = ColorInput;
