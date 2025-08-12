/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Color Group Component
  Handle a list of color options in a variable length array

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const ColorInput = require('./MURColorInput');
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InColor', 'TagBlue');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { inputStyle, opBtnStyle } = RSB.GetStyles();

const groupContainerStyle = {
  padding: '1rem 0.5rem'
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
    controlDef: _controlDef
  };
}

/// COLOR INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders an array of color UI Objects */
function ColorGroup(props) {
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
  const [sortType, setSortType] = React.useState('none');

  const controlData = RSB.GetDataForProp(draft.pending || draft.template, propDef);
  const colorProps = m_ExtractColorArrayProps(controlData);

  if (colorProps.error) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>Error: {colorProps.error}</div>
    );
  }

  const { groupName, propName, propField } = colorProps;
  const { sourceMeta, sourceData } = colorProps;
  const isDisabled = !hasLock;

  /// EVENT HANDLERS ///

  const handleDeleteItem = index => {
    const newArray = sourceData.filter((_, i) => i !== index);
    dispatch({
      op: 'update',
      propDef,
      value: newArray
    });
  };

  const handleSortChange = e => {
    const newSortType = e.target.value;
    setSortType(newSortType);
    let sortedArray;

    if (newSortType === 'none') {
      // Revert to original template order by accessing the original template data
      const originalControlData = RSB.GetDataForProp(draft.template, propDef);
      const originalProps = m_ExtractColorArrayProps(originalControlData);
      sortedArray = [...(originalProps.sourceData || [])];
    } else {
      // Sort current data
      sortedArray = [...sourceData].sort((a, b) => {
        const labelA = (a.label || '').toLowerCase();
        const labelB = (b.label || '').toLowerCase();
        return newSortType === 'a-z'
          ? labelA.localeCompare(labelB) //  'a-z'
          : labelB.localeCompare(labelA); // 'z-a'
      });
    }
    dispatch({
      op: 'update',
      propDef,
      value: sortedArray
    });
  };

  const handleAddItem = () => {
    const newItem = { color: '#808080', label: 'Label' };
    const newArray = [...sourceData, newItem];
    dispatch({
      op: 'update',
      propDef,
      value: newArray
    });
  };

  const handleTooltip = e => {
    if (e.type === 'mouseover') {
      if (tooltip) e.target.title = tooltip;
    } else if (e.type === 'mouseout') {
      if (tooltip) e.target.removeAttribute('title');
    }
  };

  /// SUB RENDER ///

  const { label, tooltip, help } = sourceMeta;

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Render color item editors for each item in the array
  const renderColorItems = () => {
    let items = [];
    const colorItems = sourceData.map((item, index) => {
      const itemHash = btoa(`${item.color}-${item.label}`);
      const itemKey = `${index}-${itemHash}`;
      const itemPropDef = `${propDef}[${index}]`;
      items.push(item);
      return (
        <div
          key={itemKey}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ColorInput propDef={itemPropDef} />
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
            onClick={() => handleDeleteItem(index)}
          >
            DELETE
          </button>
        </div>
      );
    });
    return colorItems;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Render controls for adding and sorting color items
  const ButtonControls = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.5rem',
        borderTop: '1px dotted #00000040',
        paddingTop: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ marginLeft: '0.5rem' }}>FORCE SORT:</label>
        <select
          style={inputStyle}
          disabled={isDisabled}
          value={sortType}
          onChange={handleSortChange}
        >
          <option value="none">No</option>
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
        onClick={handleAddItem}
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
      onMouseOver={handleTooltip}
      onMouseOut={handleTooltip}
    >
      {label || propName}
    </label>
  );

  /// RENDER ///

  return (
    <div style={groupContainerStyle}>
      {Label}
      <div style={{ padding: '0.5rem 0', backgroundColor: '#00000020' }}>
        {renderColorItems()}
        {ButtonControls}
      </div>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ColorGroup;
