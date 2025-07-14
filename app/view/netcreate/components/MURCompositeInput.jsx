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
/** extract composite prop data */
function u_ExtractCompositeProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName, propMeta, propData } = controlData;
  if (propData === undefined) {
    LOG(`%cNo propData found for ${groupName}.${propName}`, 'color: red');
    return [];
  }

  // For composite controls, we need to look for child controls
  // which look like { [settingName]: { control: 'in_string', labelKey: 'displayLabel' } }
  const propFields = [];
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

    propFields.push({
      propField,
      groupName,
      propName,
      control,
      label: fLabel,
      help: fHelp,
      tooltip: fTooltip
    });
  });

  return propFields; // return both propFields array and composite label
}

/// COMPOSITE INPUT COMPONENT /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A CompositeInput component that renders multiple related inputs */
function CompositeInput(props) {
  const { propDef } = props;
  const { draft } = React.useContext(RSB.SettingsContext);

  // Get control data for the composite property
  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const propFields = u_ExtractCompositeProps(controlData);

  // Render child inputs
  const ChildInputs = propFields.map(fieldUI => {
    const { propField, groupName, propName, control } = fieldUI;
    const childPropDef = RSB.EncodePropDef(groupName, propName, propField);
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
        {controlData.propName} (composite)
      </div>
      {ChildInputs}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = CompositeInput;
