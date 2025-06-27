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
/** extract text input specific data from propData and propMeta */
function u_DecodeUIData(uiData) {
  if (typeof uiData !== 'object')
    return { error: `arg1 must be an object, got ${typeof uiData}` };
  // extra data from propData and propMeta
  const { groupName, propName, propMeta, propData } = uiData;
  const { control, label, tooltip, help } = propMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = propMeta;

  // resolve useful ui data
  let fValue, fLabel, fHelp, fTooltip;

  if (valueKey) fValue = propData[valueKey];
  if (fValue === undefined) fValue = propData.value || propData[propName] || propData;

  if (labelKey) fLabel = propData[labelKey];
  if (!fLabel) fLabel = label || propName;

  if (helpKey) fHelp = propData[helpKey];
  if (!fHelp) fHelp = help || '';

  if (tooltipKey) fTooltip = propData[tooltipKey];
  if (!fTooltip) fTooltip = tooltip || '';

  return {
    groupName,
    propName,
    value: fValue,
    label: fLabel,
    tooltip: fTooltip,
    help: fHelp
  };
}

/// TEXT INPUT COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A TextInput component */
function TextInput(props) {
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
  const uiData = RSB.GetUIData(draft.template, propDef);
  const { name, label, tooltip, help, placeholder, value } = u_DecodeUIData(uiData);
  const defValue = undefined; // TODO: handle default values

  // declare reactive render state
  // note that this only runs on the FIRST render, which is why
  // we need the useEffect() to work around it
  const [labelColor, setLabelColor] = React.useState('black');
  const [tooltipStyle, setTooltipStyle] = React.useState({ ...popupStyle });
  const templateValue = value || defValue;
  const [inputValue, setInputValue] = React.useState(value || defValue);

  // this is a workaround for React's stupidity about dataflow, state
  // retention with hooks, and other bullshit.
  React.useEffect(() => {
    if (!draft.pending) {
      const uiData = RSB.GetUIData(draft.template, propDef);
      const { value } = u_DecodeUIData(uiData);
      setInputValue(value || defValue);
    }
  }, [draft.pending]);

  /// UI-SETTINGS INTEROP EVENT UPDATES ///

  // send data to draft object, which will trigger rerender
  const submitToSettings = async event => {
    const value = String(event.target.value);
    dispatch({
      op: 'update',
      propDef,
      value
    });
  };

  /// LOCAL EVENT UPDATES ///

  // input changes will update the current templateValue =value || defValue;
  const handleTyping = event => {
    const value = event.target.value;
    setInputValue(value);
  };

  // input key return will submit the value to draft object
  const handleEnterKey = async event => {
    if (event.key === 'Enter') submitToSettings(event);
  };

  // hovering over label will show tooltip
  const handleTooltip = event => {
    if (event.type === 'mouseover') {
      const offset = RSB.EventTargetOffsetStyle(event);
      const content = tooltip || '';
      setTooltipStyle({
        ...popupStyle,
        ...offset,
        display: 'block',
        content
      });
      setLabelColor('maroon');
    } else if (event.type === 'mouseout') {
      setTooltipStyle({ ...popupStyle });
      setLabelColor('black');
    }
  };

  /// RENDER ///

  // conditional flags based on templateValue =value || defValue;
  const mod = templateValue !== inputValue;
  const bgColor = mod ? modColor : 'white';
  const pad = mod ? '1rem' : '0';

  const InputField = hasLock ? (
    <input
      type="text"
      name={`${name}`}
      style={{
        ...inputStyle,
        color: labelColor,
        backgroundColor: bgColor,
        paddingRight: pad
      }}
      value={inputValue}
      onKeyDown={handleEnterKey}
      onBlur={submitToSettings}
      onChange={handleTyping}
    />
  ) : (
    <p>{inputValue}</p>
  );

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
      {InputField}
      {tooltip && <div style={tooltipStyle}>{tooltip}</div>}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TextInput;
