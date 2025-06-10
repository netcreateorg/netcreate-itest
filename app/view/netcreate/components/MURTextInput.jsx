/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Text Input Component

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
const { itemGrid, labelStyle, inputStyle, popupStyle, modColor } = RSB.GetStyles();

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** quote a string or return as-is number */
function $(strOrNum) {
  return typeof strOrNum === 'string' ? `'${strOrNum}'` : strOrNum;
}

/// TEXT INPUT COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A TextInput component */
function TextInput(props) {
  const { propDef } = props;
  const { settings, dispatch } = React.useContext(RSB.SettingsContext);
  const data = RSB.DecodeUIData(settings, propDef);
  const { groupName, propName } = data;
  const { name, value, default: defValue } = data;
  const { label, tooltip, help, placeholder } = data;
  // declare reactive render state
  const [labelColor, setLabelColor] = React.useState('black');
  const [tooltipStyle, setTooltipStyle] = React.useState({ ...popupStyle });
  const [oldStyle, setOldStyle] = React.useState({ ...popupStyle });
  const [oldValue] = React.useState(value || defValue);
  const [inputValue, setInputValue] = React.useState(value || defValue);

  /// UI-SETTINGS INTEROP EVENT UPDATES ///

  // send data to settings object, which will trigger rerender
  const submitToSettings = async event => {
    const value = event.target.value;
    console.log('would', propDef, 'submitToSettings', $(value));
  };

  /// LOCAL EVENT UPDATES ///

  // input changes will update the current inputValue
  const handleTyping = event => {
    const value = event.target.value;
    setInputValue(value);
  };

  // input key return will submit the value to settings object
  const handleEnterKey = async event => {
    if (event.key === 'Enter') submitToSettings(event.target.value);
  };

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
        onKeyDown={handleEnterKey}
        onBlur={submitToSettings}
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
