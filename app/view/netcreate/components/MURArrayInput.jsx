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

  const { groupName, propName, propField, sourceMeta, sourceData, sourceSchema } =
    controlData;

  if (!Array.isArray(sourceData)) return { error: 'sourceData must be an array' };

  if (!sourceSchema || typeof sourceSchema !== 'object')
    return { error: 'sourceSchema must be an object defining field types' };

  return {
    groupName,
    propName,
    propField,
    items: sourceData,
    schema: sourceSchema,
    metadata: sourceMeta
  };
}

/// ARRAY ITEM COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Renders a single array item with editable fields based on schema */
function ArrayItem({
  item,
  index,
  schema,
  onUpdate,
  onRemove,
  disabled,
  templateItem
}) {
  const [inputValues, setInputValues] = React.useState(item);

  // sync local state when template changes
  React.useEffect(() => {
    setInputValues(item);
  }, [item]);

  const u_handleFieldChange = (fieldName, value) => {
    setInputValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const u_submitToSettings = () => {
    const updatedItem = { ...inputValues };
    onUpdate(index, updatedItem);
  };

  const u_handleEnterKey = event => {
    if (event.key === 'Enter') {
      u_submitToSettings();
    }
  };

  const u_handleBlur = () => {
    u_submitToSettings();
  };

  return (
    <div style={arrayItemStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {Object.keys(schema).map(fieldName => {
          const fieldType = schema[fieldName];
          const inputValue = inputValues[fieldName] || '';
          const templateValue = templateItem ? templateItem[fieldName] || '' : '';
          const mod = templateValue !== inputValue;
          const bgColor = mod ? modColor : 'white';

          return (
            <div key={fieldName}>
              <label style={labelStyle}>{fieldName}:</label>
              {fieldType === 'string' && fieldName === 'color' ? (
                <input
                  type="color"
                  value={inputValue}
                  onChange={e => u_handleFieldChange(fieldName, e.target.value)}
                  onBlur={u_handleBlur}
                  disabled={disabled}
                  style={{
                    ...inputStyle,
                    width: '60px',
                    height: '30px',
                    backgroundColor: bgColor
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => u_handleFieldChange(fieldName, e.target.value)}
                  onKeyDown={u_handleEnterKey}
                  onBlur={u_handleBlur}
                  disabled={disabled}
                  style={{ ...inputStyle, backgroundColor: bgColor }}
                  placeholder={`Enter ${fieldName}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#666' }}>#{index}</div>
      <button
        onClick={() => onRemove(index)}
        disabled={disabled}
        style={{ ...opBtnStyle, backgroundColor: '#ff6b6b', color: 'white' }}
        title="Remove item"
      >
        ×
      </button>
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

  const { groupName, propName, propField, items, schema, metadata } = arrayProps;
  const isDisabled = !hasLock;

  const u_handleItemUpdate = (index, updatedItem) => {
    const newArray = [...items];
    newArray[index] = updatedItem;
    dispatch({
      op: 'update',
      propDef,
      value: newArray
    });
  };

  const u_handleItemRemove = index => {
    const newArray = items.filter((_, i) => i !== index);
    dispatch({
      op: 'update',
      propDef,
      value: newArray
    });
  };

  const u_handleAddItem = () => {
    const newItem = {};
    Object.keys(schema).forEach(fieldName => {
      const fieldType = schema[fieldName];
      if (fieldType === 'string') {
        newItem[fieldName] = fieldName === 'color' ? '#d4d4d4' : '';
      }
    });

    const newArray = [...items, newItem];
    dispatch({
      op: 'update',
      propDef,
      value: newArray
    });
  };

  return (
    <div style={arrayContainerStyle}>
      <div
        style={{
          marginBottom: '1rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '0.5rem'
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0' }}>{metadata.label || propField}</h4>
        {metadata.help && (
          <div style={{ fontSize: '0.9rem', color: '#666' }}>{metadata.help}</div>
        )}
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          No items yet. Click &quot;Add Item&quot; to get started.
        </div>
      ) : (
        items.map((item, index) => (
          <ArrayItem
            key={index}
            item={item}
            templateItem={item}
            index={index}
            schema={schema}
            onUpdate={u_handleItemUpdate}
            onRemove={u_handleItemRemove}
            disabled={isDisabled}
          />
        ))
      )}

      <button
        onClick={u_handleAddItem}
        disabled={isDisabled}
        style={{
          ...opBtnStyle,
          backgroundColor: '#51cf66',
          color: 'white',
          marginTop: '1rem'
        }}
      >
        + Add Item
      </button>

      {isDisabled && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
          Template is locked - editing disabled
        </div>
      )}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ArrayInput;
