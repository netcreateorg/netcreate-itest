/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Color Input Component
  Handle color item editing with color picker and label field

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InColor', 'TagBlue');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { itemGrid, labelStyle, inputStyle, popupStyle, modColor, opBtnStyle } =
  RSB.GetStyles();

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ExtractColorProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName, propField } = controlData;
  const { sourceMeta, sourceData } = controlData;

  const { label, tooltip, help } = sourceMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = sourceMeta;

  // resolve useful ui data
  let fValue, fLabel, fHelp, fTooltip, colorValue, labelValue;

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
  if (!fTooltip) fTooltip = tooltip || fHelp || '';

  // extract color and label from the item object
  if (fValue) {
    colorValue = fValue.color || '#000000';
    labelValue = fValue.label || '';
  }

  return {
    groupName,
    propName,
    propField,
    colorValue,
    labelValue,
    label: fLabel,
    tooltip: fTooltip,
    help: fHelp
  };
}

/// COLOR ITEM EDIT COMPONENT /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A ColorInput component */
function ColorInput(props) {
  // propName, groupName.propName, or groupName.propName.fieldName
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
  // controlData contains what's needed to render this input component
  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const { colorValue, labelValue, label, tooltip, help } =
    m_ExtractColorProps(controlData);
  const defColorValue = '#000000';
  const defLabelValue = '';

  // declare reactive render state
  // note that this only runs on the FIRST render, which is why
  // we need the useEffect() to work around it
  const [labelColor, setLabelColor] = React.useState('black');
  const templateColorValue = colorValue || defColorValue;
  const templateLabelValue = labelValue || defLabelValue;
  const [inputColorValue, setInputColorValue] = React.useState(
    colorValue || defColorValue
  );
  const [inputLabelValue, setInputLabelValue] = React.useState(
    labelValue || defLabelValue
  );

  // this is a workaround for React's stupidity about dataflow, state
  // retention with hooks, and other bullshit.
  React.useEffect(() => {
    if (!draft.pending) {
      const { colorValue, labelValue } = m_ExtractColorProps(controlData);
      setInputColorValue(colorValue || defColorValue);
      setInputLabelValue(labelValue || defLabelValue);
    }
  }, [draft.pending]);

  /// UI-SETTINGS INTEROP EVENT UPDATES ///

  // send color data to draft object, which will trigger rerender
  const submitColorToSettings = async newColor => {
    const value = { color: newColor, label: inputLabelValue };
    dispatch({
      op: 'update',
      propDef,
      value
    });
  };

  // send label data to draft object, which will trigger rerender
  const submitLabelToSettings = async newLabel => {
    const value = { color: inputColorValue, label: newLabel };
    dispatch({
      op: 'update',
      propDef,
      value
    });
  };

  /// LOCAL EVENT UPDATES ///

  // color changes will update the current value
  const handleColorChange = event => {
    const color = event.target.value;
    setInputColorValue(color);
    console.log(`Color change for ${propDef}:`, color);
    submitColorToSettings(color);
  };

  // label changes will update the current value
  const handleLabelTyping = event => {
    const label = event.target.value;
    setInputLabelValue(label);
  };

  // label key return will submit the value to draft object
  const handleLabelEnterKey = async event => {
    if (event.key === 'Enter') {
      const label = event.target.value;
      console.log(`Label change for ${propDef}:`, label);
      submitLabelToSettings(label);
    }
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

  /// SUB RENDER ///

  // conditional flags based on template values
  const colorMod = templateColorValue !== inputColorValue;
  const labelMod = templateLabelValue !== inputLabelValue;
  const mod = colorMod || labelMod;
  const bgColor = mod ? modColor : 'white';

  // conditional flags based on template values
  const isDefaultLabel = !labelValue || labelValue === '';

  // render either enabled or disabled based on hasLock
  const InputField = hasLock ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="color"
        value={inputColorValue}
        style={{
          width: '40px',
          height: '30px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          backgroundColor: bgColor
        }}
        onChange={handleColorChange}
      />
      <input
        type="text"
        value={inputLabelValue}
        placeholder={isDefaultLabel ? '<default>' : 'Label'}
        disabled={isDefaultLabel}
        style={{
          ...inputStyle,
          minWidth: '120px',
          backgroundColor: isDefaultLabel ? '#f5f5f5' : bgColor,
          cursor: isDefaultLabel ? 'not-allowed' : 'text'
        }}
        onKeyDown={isDefaultLabel ? undefined : handleLabelEnterKey}
        onBlur={
          isDefaultLabel
            ? undefined
            : e => {
                submitLabelToSettings(e.target.value);
              }
        }
        onChange={isDefaultLabel ? undefined : handleLabelTyping}
      />
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: inputColorValue,
          border: '1px solid #ccc',
          borderRadius: '3px'
        }}
      />
      <span>{inputLabelValue || '<default>'}</span>
      {/* <span style={{ color: 'gray', fontSize: '0.8em' }}>({inputColorValue})</span> */}
    </div>
  );

  /// RENDER ///

  return <div style={itemGrid}>{InputField}</div>;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ColorInput;
