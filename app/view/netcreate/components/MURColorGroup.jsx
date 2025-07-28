/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Color Group Component
  Handle a list of color options in a variable length array

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import ColorItemEdit from './MURColorInput';
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
  const { sourceMeta, sourceData } = controlData;
  const { _controlDef } = controlData;

  if (!Array.isArray(sourceData)) return { error: 'sourceData must be an array' };

  return {
    groupName,
    propName,
    propField,
    sourceData,
    sourceMeta,
    controlDef: _controlDef || {}
  };
}

/// COLOR INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders an array of color UI Objects */
function ColorGroup(props) {
  const { propDef } = props;
  const { draft, hasLock } = React.useContext(RSB.SettingsContext);

  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const colorProps = m_ExtractColorArrayProps(controlData);

  if (colorProps.error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>Error: {colorProps.error}</div>
    );
  }

  const { groupName, propName, propField } = colorProps;
  const { sourceMeta, sourceData } = colorProps;
  const isDisabled = !hasLock;

  /// SUB RENDER ///

  const { label, tooltip, help } = sourceMeta;

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Render color item editors for each item in the array
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Render controls for adding and sorting color items
  const ButtonControls = (
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
  );
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// render label above the color group
  const Label = (
    <label
      style={{
        marginBottom: '0.5rem',
        display: 'block'
      }}
      onMouseOver={e => {
        if (tooltip) e.target.title = tooltip;
      }}
      onMouseOut={e => {
        if (tooltip) e.target.removeAttribute('title');
      }}
    >
      {label || propName}
    </label>
  );

  /// RENDER ///

  return (
    <div style={arrayContainerStyle}>
      {Label}
      {ColorItemControls}
      {ButtonControls}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ColorGroup;
