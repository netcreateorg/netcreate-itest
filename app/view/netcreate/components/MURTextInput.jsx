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
function u_ExtractInputProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };
  //
  const { groupName, propName, propField } = controlData;
  const { sourceMeta, sourceData } = controlData;

  const { label, tooltip, help } = sourceMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = sourceMeta;

  // resolve useful ui data
  let fValue, fLabel, fHelp, fTooltip;

  // special case ... this is always a sourceData extraction
  if (valueKey) fValue = sourceData[valueKey];
  if (fValue === undefined) fValue = sourceData[propName] || sourceData;

  // if labelKey exists, use it. Otherwise meta has to provide a label
  if (labelKey) fLabel = sourceData[labelKey];
  if (!fLabel) fLabel = label || '<label not in template>';

  // if helpKey exists, use it. Otherwise meta has to provide a help text
  if (helpKey) fHelp = sourceData[helpKey];
  if (!fHelp) fHelp = help || '';

  // if tooltipKey exists, use it. Otherwise meta has to provide a tooltip
  if (tooltipKey) fTooltip = sourceData[tooltipKey];
  if (!fTooltip) fTooltip = tooltip || '';

  return {
    groupName,
    propName,
    propField,
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
  // propName, groupName.propName, or groupName.propName.fieldName
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
  // controlData contains what's needed to render this input component
  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const { name, label, tooltip, help, placeholder, value } =
    u_ExtractInputProps(controlData);
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
      const { value } = u_ExtractInputProps(controlData);
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
