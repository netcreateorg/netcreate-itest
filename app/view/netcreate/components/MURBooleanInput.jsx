/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Boolean Input Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InBool', 'TagBlue');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { itemGrid, labelStyle, inputStyle, popupStyle, modColor } = RSB.GetStyles();

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_ExtractBooleanProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName, propField } = controlData;
  const { sourceMeta, sourceData } = controlData;

  const { label, tooltip, help } = sourceMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = sourceMeta;

  // resolve useful ui data
  let fValue, fLabel, fHelp, fTooltip;

  // special case: if a boolean property is not defined, we assume false
  if (sourceData === undefined) fValue = false;
  else {
    if (valueKey) fValue = sourceData[valueKey];
    if (fValue === undefined) fValue = sourceData[propName] || sourceData;
  }

  // if labelKey exists, use it. Otherwise meta has to provide a label
  if (labelKey) fLabel = sourceData[labelKey];
  if (!fLabel) fLabel = label || '<label not in template>';

  // if helpKey exists, use it. Otherwise meta has to provide a help text
  if (helpKey) fHelp = sourceData[helpKey];
  if (!fHelp) fHelp = help || '';

  // if tooltipKey exists, use it. Otherwise meta has to provide a tooltip
  if (tooltipKey) fTooltip = sourceData[tooltipKey];
  if (!fTooltip) fTooltip = tooltip || fHelp || '';

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

/// BOOLEAN INPUT COMPONENT ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A BooleanInput component */
function BooleanInput(props) {
  // propName, groupName.propName, or groupName.propName.fieldName
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
  // controlData contains what's needed to render this input component
  const controlData = RSB.GetDataForProp(draft.pending || draft.template, propDef);
  const { name, label, tooltip, help, placeholder, value } =
    u_ExtractBooleanProps(controlData);
  const defValue = false; // default boolean value

  // declare reactive render state
  // note that this only runs on the FIRST render, which is why
  // we need the useEffect() to work around it
  const [labelColor, setLabelColor] = React.useState('black');
  const [tooltipStyle, setTooltipStyle] = React.useState({ ...popupStyle });
  const templateValue = value !== undefined ? value : defValue;
  const [inputValue, setInputValue] = React.useState(
    value !== undefined ? value : defValue
  );

  // this is a workaround for React's stupidity about dataflow, state
  // retention with hooks, and other bullshit.
  React.useEffect(() => {
    if (!draft.pending) {
      const { value } = u_ExtractBooleanProps(controlData);
      setInputValue(value !== undefined ? value : defValue);
    }
  }, [draft.pending]);

  /// UI-SETTINGS INTEROP EVENT UPDATES ///

  // send data to draft object, which will trigger rerender
  const submitToSettings = async event => {
    const value = Boolean(event.target.checked);
    dispatch({
      op: 'update',
      propDef,
      value
    });
  };

  /// LOCAL EVENT UPDATES ///

  // checkbox changes will update the current value and submit immediately
  const handleChange = event => {
    const value = event.target.checked;
    setInputValue(value);
    submitToSettings(event);
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

  // conditional flags based on templateValue
  const mod = templateValue !== inputValue;
  const bgColor = mod ? modColor : 'white';

  const InputField = hasLock ? (
    <input
      type="checkbox"
      name={`${name}`}
      style={{
        ...inputStyle,
        backgroundColor: bgColor
      }}
      checked={inputValue}
      onChange={handleChange}
    />
  ) : (
    <p>{inputValue ? 'true' : 'false'}</p>
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
module.exports = BooleanInput;
