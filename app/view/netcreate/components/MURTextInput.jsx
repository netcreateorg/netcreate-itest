/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Text Input Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { UpdateProperty, UpdateGroup, ReactlListKey: RLK } = RSB;
const { GetStyles, EventTargetOffsetStyle } = RSB;

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { itemStyle, labelStyle, inputStyle, ttStyle } = GetStyles();

/// TEXT INPUT COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A TextInput component */
function TextInput(props) {
  const { group, name, metadata, memory } = props;
  if (DBG) {
    if (typeof group !== 'string') return <p>TextInput bad group</p>;
    if (typeof name !== 'string') return <p>TextInput bad name</p>;
    if (typeof metadata !== 'object') return <p>TextInput bad metadata</p>;
  }
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
      const offset = EventTargetOffsetStyle(event);
      setTooltipStyle({
        ...ttStyle,
        ...offset,
        display: 'block',
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
      const offset = EventTargetOffsetStyle(event);
      setOldStyle({
        ...ttStyle,
        ...offset,
        display: 'block',
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
