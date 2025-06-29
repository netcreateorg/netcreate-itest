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
  const { control, label } = propMeta;

  // For composite controls, we need to look for child controls
  // which look like { [settingName]: { control: 'in-string', labelKey: 'displayLabel' } }
  const settings = [];
  Object.keys(propMeta).forEach(setn => {
    if (setn === 'control') return;
    settings.push({ settingKey: setn, ...propMeta[setn] });
  });

  return settings; // array of { settingKey, meta }
}

/// COMPOSITE INPUT COMPONENT /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A CompositeInput component that renders multiple related inputs */
function CompositeInput(props) {
  const { propDef } = props;
  const { draft } = React.useContext(RSB.SettingsContext);

  // Get UI data for the composite property
  const uiData = RSB.GetUIData(draft.template, propDef);
  const uiSettings = u_DecodeCompositeData(uiData);

  LOG(...PR(`CompositeInput for ${propDef}:`, uiSettings));

  // Render child inputs
  const ChildInputs = uiSettings.forEach(setUI => {
    const { control, ...childMeta } = setUI;
    switch (control) {
      case 'in-string':
      case 'in-text':
        return <TextInput propDef={childPropDef} key={childKey} />;
      default:
        return (
          <div
            key={childKey}
            style={{
              margin: '0.5rem 0',
              padding: '0.5rem',
              border: '1px dashed #ccc'
            }}
          >
            <span>{childProp}: </span>
            <span style={{ color: 'gray' }}>[{childControl}]</span>
          </div>
        );
    }
  });

  return (
    <div
      style={{
        margin: '1rem 0',
        padding: '1rem',
        border: '2px solid #e0e0e0',
        borderRadius: '4px'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#666' }}>
        {label} (composite)
      </div>
      {ChildInputs}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = CompositeInput;
