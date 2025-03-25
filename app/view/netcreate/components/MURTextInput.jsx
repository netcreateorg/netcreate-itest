/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Text Input Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const { ReactListKey: RLK } = require('./react-settings-bridge');

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
  const { name, metadata } = props;
  if (typeof name !== 'string') return <p>getTextInput bad name</p>;
  if (typeof metadata !== 'object') return <p>getTextInput bad metadata</p>;
  const { label, tooltip, help, placeholder, value, default: defValue } = metadata;

  const [labelColor, setLabelColor] = React.useState('black');
  const [tooltipStyle, setTooltipStyle] = React.useState({ ...ttStyle });

  const handleKeydown = event => {
    if (event.key === 'Enter') {
      console.log('keydown enter: would submit value');
    }
  };

  const handleTyping = event => {
    console.log('typing:', event.target.value);
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
        style={{ ...inputStyle, labelColor }}
        defaultValue={defValue}
        onKeyDown={handleKeydown}
        onInput={handleTyping}
      />
      {tooltip && <div style={tooltipStyle}>{tooltip}</div>}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TextInput;
