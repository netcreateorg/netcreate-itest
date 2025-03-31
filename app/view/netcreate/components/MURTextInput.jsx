/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Text Input Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings } = require('ursys-min'); // import the settings manager
const RSB = require('./react-settings-bridge');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const SettingsContext = RSB.GetContext();

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { itemGrid, labelStyle, inputStyle, popupStyle, modColor } = RSB.GetStyles();

/// TEXT INPUT COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A TextInput component */
function TextInput(props) {
  const { propDef, metaDef } = props;
  if (DBG) {
    if (typeof propDef !== 'object') return <p>TextInput bad groupDef</p>;
    if (typeof metaDef !== 'object') return <p>TextInput bad metaDef</p>;
  }
  const { value, default: defValue } = propDef;
  const { label, tooltip, help, placeholder } = metaDef;
  // declare reactive render state
  const [labelColor, setLabelColor] = React.useState('black');
  const [tooltipStyle, setTooltipStyle] = React.useState({ ...popupStyle });
  const [oldStyle, setOldStyle] = React.useState({ ...popupStyle });
  const [oldValue] = React.useState(value || defValue);
  const [inputValue, setInputValue] = React.useState(value || defValue);

  /// CONTEXT ///

  const api = React.useContext(SettingsContext);

  /// TESTS ///

  function assert_is_modified() {
    if (label === 'description')
      console.log(
        `old / input / propDef\n${oldValue} \t${inputValue} \t${propDef.value}`
      );
  }

  /// HANDLERS ///

  // input changes will update the current inputValue
  const handleTyping = event => {
    propDef.value = event.target.value;
    setInputValue(propDef.value);
  };

  // input key return will submit the value to settings object
  const handleEnterSubmit = async event => {
    if (event.key === 'Enter') handleSubmit(event);
  };

  // input blur will submit the value to settings object
  const handleSubmit = React.useCallback(
    event => {
      propDef.value = event.target.value;
      LOG('handleSubmit API', api, 'propDef', propDef);
    },
    [api]
  );

  // hovering over label will show tooltip
  const handleTooltip = event => {
    if (event.type === 'mouseover') {
      const offset = RSB.EventTargetOffsetStyle(event);
      setTooltipStyle({
        ...popupStyle,
        ...offset,
        display: 'block',
        content: tooltip || ''
      });
      setLabelColor('maroon');
    } else if (event.type === 'mouseout') {
      setTooltipStyle({ ...popupStyle });
      setLabelColor('black');
    }
  };

  // hovering over a changed input will show the old value
  const showOldValue = event => {
    if (oldValue === inputValue) {
      setOldStyle({ ...popupStyle });
      return;
    } else if (event.type === 'mouseover') {
      const offset = RSB.EventTargetOffsetStyle(event);
      setOldStyle({
        ...popupStyle,
        ...offset,
        display: 'block',
        content: oldValue || ''
      });
    } else if (event.type === 'mouseout') {
      setOldStyle({ ...popupStyle });
    }
  };

  /// RENDER ///

  // conditional flags based on inputValue
  const mod = inputValue !== oldValue;
  const bgColor = mod ? modColor : 'white';
  const pad = mod ? '1rem' : '0';

  // assert_is_modified();

  return (
    <div style={itemGrid}>
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
        onKeyDown={handleEnterSubmit}
        onBlur={handleSubmit}
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
