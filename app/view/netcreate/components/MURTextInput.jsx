/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Text Input Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const {
  UpdateProperty,
  UpdateGroup,
  ReactListKey: RLK
} = require('./react-settings-bridge');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const itemStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(200px,max-content) auto',
  margin: '0.25rem'
};
const labelStyle = { paddingRight: '0.5rem' };
const inputStyle = { border: '1px solid #cc8' };
const ttStyle = {
  position: 'fixed',
  backgroundColor: 'gray',
  color: 'white',
  padding: '5px',
  zIndex: 1000,
  maxWidth: '250px',
  display: 'none'
};

/// TEXT INPUT COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A TextInput component */
function TextInput(props) {
  const { group, name, metadata } = props;
  if (typeof group !== 'string') return <p>TextInput bad group</p>;
  if (typeof name !== 'string') return <p>TextInput bad name</p>;
  if (typeof metadata !== 'object') return <p>TextInput bad metadata</p>;
  const { label, tooltip, help, placeholder, value, default: defValue } = metadata;

  const [labelColor, setLabelColor] = React.useState('black');
  const [tooltipStyle, setTooltipStyle] = React.useState({ ...ttStyle });
  const [oldStyle, setOldStyle] = React.useState({ ...ttStyle });
  const [oldValue] = React.useState(value || defValue);
  const [inputValue, setInputValue] = React.useState(oldValue);

  const handleSubmit = async event => {
    if (event.key === 'Enter') {
      console.log('submit:', event.target.value);
      const opResult = await UpdateProperty(`${group}.${name}`, event.target.value);
      if (opResult.error) console.log('Error:', opResult.error);
    }
  };

  const handleTyping = event => {
    setInputValue(event.target.value);
  };

  const handleTooltip = event => {
    if (event.type === 'mouseover') {
      setTooltipStyle({
        ...ttStyle,
        display: 'block',
        left: `${event.pageX + 5}px`,
        top: `${event.pageY + 15}px`,
        content: tooltip || ''
      });
      setLabelColor('maroon');
    } else if (event.type === 'mouseout') {
      setTooltipStyle({ ...ttStyle });
      setLabelColor('black');
    }
  };

  const showOldValue = event => {
    if (oldValue === inputValue) {
      setOldStyle({ ...ttStyle });
      return;
    } else if (event.type === 'mouseover') {
      const rect = event.target.getBoundingClientRect();
      setOldStyle({
        ...ttStyle,
        display: 'block',
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.top + window.scrollY + 30}px`,
        content: oldValue || ''
      });
    } else if (event.type === 'mouseout') {
      setOldStyle({ ...ttStyle });
    }
  };

  const mod = inputValue !== oldValue;
  const bgColor = mod ? '#ffff00a0' : 'white';
  const pad = mod ? '1rem' : '0';

  return (
    <div style={itemStyle}>
      <label
        htmlFor={name}
        style={{ ...labelStyle, color: labelColor }}
        onMouseOver={handleTooltip}
        onMouseOut={handleTooltip}
      >
        {label || name}
      </label>
      <input
        type="text"
        name="${name}"
        style={{
          ...inputStyle,
          color: labelColor,
          backgroundColor: bgColor,
          paddingRight: pad
        }}
        defaultValue={inputValue}
        onKeyDown={handleSubmit}
        onInput={handleTyping}
        onMouseOver={showOldValue}
        onMouseOut={showOldValue}
      />
      {tooltip && <div style={tooltipStyle}>{tooltip}</div>}
      <div style={oldStyle}>
        <span style={{ opacity: 0.5 }}>old value: </span>
        {oldValue}
      </div>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TextInput;
