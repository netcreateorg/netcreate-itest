/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Composite Input Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('CompositeIn', 'TagCyan');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extract composite UI data */
function u_DecodeCompositeData(uiData) {
  if (typeof uiData !== 'object')
    return { error: `arg1 must be an object, got ${typeof uiData}` };

  const { groupName, propName, propMeta, propData } = uiData;
  if (propData === undefined) {
    LOG(`%cNo propData found for ${groupName}.${propName}`, 'color: red');
    return [];
  }

  // For composite controls, we need to look for child controls
  // which look like { [settingName]: { control: 'in_string', labelKey: 'displayLabel' } }
  const settings = [];
  Object.keys(propMeta).forEach(propField => {
    if (propField === 'control') return;

    const fieldMeta = propMeta[propField];
    const { control, labelKey, helpKey, tooltipKey, label, help, tooltip } =
      fieldMeta;

    // NOTE: This normalizing code could be moved into a common RSB helper
    // resolve useful ui data using fallthrough assignment pattern
    let fLabel, fHelp, fTooltip;

    if (labelKey) fLabel = propData[labelKey];
    if (!fLabel) fLabel = label || propField;

    if (helpKey) fHelp = propData[helpKey];
    if (!fHelp) fHelp = help || '';

    if (tooltipKey) fTooltip = propData[tooltipKey];
    if (!fTooltip) fTooltip = tooltip || '';

    settings.push({
      propField,
      groupName,
      propName,
      control,
      label: fLabel,
      help: fHelp,
      tooltip: fTooltip
    });
  });

  return settings; // return both settings array and composite label
}

/// COMPOSITE INPUT COMPONENT /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A CompositeInput component that renders multiple related inputs */
function CompositeInput(props) {
  const { propDef } = props;
  const { draft } = React.useContext(RSB.SettingsContext);

  // Get UI data for the composite property
  const uiData = RSB.GetUIData(draft.template, propDef);
  const settings = u_DecodeCompositeData(uiData);

  // Render child inputs
  const ChildInputs = settings.map(fieldUI => {
    const { propField, groupName, propName, control } = fieldUI;
    const childPropDef = RSB.EncodeDotProp(groupName, propName, propField);
    const childKey = `field-${propField}`;

    switch (control) {
      case 'in_string':
      case 'in_text':
        return <TextInput propDef={childPropDef} key={childKey} />;
      default:
        return (
          <div key={childKey}>
            <span>{propField}: </span>
            <span style={{ color: 'gray' }}>[{control}]</span>
          </div>
        );
    }
  });

  return (
    <div
      style={{
        margin: '1rem 0'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#666' }}>
        {uiData.propName} (composite)
      </div>
      {ChildInputs}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = CompositeInput;
