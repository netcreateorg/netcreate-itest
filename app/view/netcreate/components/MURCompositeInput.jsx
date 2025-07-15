/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Composite Input Component
  Handle a group of ui items as a single composite setting

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
import BooleanInput from './MURBooleanInput';
import ArrayInput from './MURArrayInput';
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

  const { groupName, propName } = controlData;
  const { sourceMeta, sourceData } = controlData;

  if (sourceData === undefined) {
    LOG(`%cNo sourceData found for ${groupName}.${propName}`, 'color: red');
    return [];
  }

  // For composite controls, we need to look for child controls
  // which look like { [settingName]: { control: 'in_string', labelKey: 'displayLabel' } }
  const propFields = [];
  Object.keys(sourceMeta).forEach(propField => {
    if (propField.startsWith('_')) return;

    const fieldMeta = sourceMeta[propField];
    const { _control, labelKey, helpKey, tooltipKey, label, help, tooltip } =
      fieldMeta;

    // skip disabled controls
    if (_control && _control.startsWith('//')) {
      LOG('.. %cskipping disabled composite field:', 'color: blue', propField);
      return; // skip this iteration
    }

    // NOTE: This normalizing code could be moved into a common RSB helper
    // resolve useful ui data using fallthrough assignment pattern
    let fLabel, fHelp, fTooltip;

    if (labelKey) fLabel = sourceData[labelKey];
    if (!fLabel) fLabel = label || propField;

    if (helpKey) fHelp = sourceData[helpKey];
    if (!fHelp) fHelp = help || '';

    if (tooltipKey) fTooltip = sourceData[tooltipKey];
    if (!fTooltip) fTooltip = tooltip || '';

    propFields.push({
      propField,
      groupName,
      propName,
      _control,
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
    const { propField, groupName, propName, _control } = fieldUI;
    const childPropDef = RSB.EncodePropDef(groupName, propName, propField);
    const childKey = `field-${propField}`;

    switch (_control) {
      case 'in_string':
      case 'in_text':
        return <TextInput propDef={childPropDef} key={childKey} />;
      case 'in_boolean':
        return <BooleanInput propDef={childPropDef} key={childKey} />;
      case 'array':
        return <ArrayInput propDef={childPropDef} key={childKey} />;
      case 'in_number':
      default:
        return (
          <div key={childKey}>
            <span>{propField}: </span>
            <span style={{ color: 'gray' }}>[{_control}]</span>
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
        {controlData.propName}
      </div>
      {ChildInputs}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = CompositeInput;
