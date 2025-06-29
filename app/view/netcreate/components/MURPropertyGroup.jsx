/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
import CompositeInput from './MURCompositeInput';
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('PGroup', 'TagBlue');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { propLabel } = props;
  return (
    <span>
      <b>{propLabel}</b>
    </span>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extract UI data for property group rendering */
function u_DecodeUIData(uiData) {
  if (typeof uiData !== 'object')
    return { error: `arg1 must be an object, got ${typeof uiData}` };

  const { groupName, propName, propMeta, propData } = uiData;
  const { control, label, tooltip, help } = propMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = propMeta;

  // resolve useful ui data using fallthrough assignment
  let fControl, fLabel, fHelp, fTooltip;

  fControl = control || '<missing control type>';

  if (labelKey) fLabel = propData[labelKey];
  if (!fLabel) fLabel = label || propName || '<no label found>';

  if (helpKey) fHelp = propData[helpKey];
  if (!fHelp) fHelp = help || '';

  if (tooltipKey) fTooltip = propData[tooltipKey];
  if (!fTooltip) fTooltip = tooltip || '';

  return {
    groupName,
    propName,
    control: fControl,
    label: fLabel,
    tooltip: fTooltip,
    help: fHelp
  };
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A PropertyGroup component that displays a group of properties, having
 *  received groupName */
function PropertyGroup(props) {
  const groupName = props.groupName || ''; // e.g. 'graphSettings'
  const { draft } = React.useContext(RSB.SettingsContext);
  const metaSource = draft.template._ui || {};

  // editable properties are in propsData and propNames
  // which are derived by scanning metaSource which is the groupmeta
  // dictionary that determines what the UI should display

  let propNames; // array of property names to display
  let propsData = {}; // related

  if (groupName === '') {
    /// CASE 1: NO GROUP NAME, ONLY PROP NAME AVAILABLE ///
    propNames = RSB.GetUISettingsList(metaSource).globalsList || [];
    propNames.forEach(p => (propsData[p] = metaSource[p]));
    propsData._src = '';
    if (metaSource._editor && metaSource._editor.global) {
      propsData._editor = metaSource._editor.global;
    } else {
      propsData._editor = { propLabel: '<editor global>', description: '' };
    }
  } else {
    /// CASE 2: GROUP NAME AND PROP NAME AVAIABLE ///
    propsData = { ...(metaSource[groupName] || draft.template[groupName] || {}) };
    LOG(...PR(`PropertyGroup: groupName=${groupName}`, propsData));
    propsData._src = groupName;
    propNames = Object.keys(propsData).filter(p => p.startsWith('_') === false);
  }

  // look for title in propsData or _editor.global
  const groupmeta = propsData[groupName] || propsData._editor || {};
  const grpTitle = groupmeta.label || groupName.toUpperCase() || '<title not set>';
  const grpDesc = groupmeta.description || '';
  const key = `pg-${groupName}`;

  /// RENDER ///

  const PropertyList = propNames.map(p => {
    const propDef = RSB.EncodeDotProp(groupName, p);
    const inputKey = `in-${propDef}`;

    // Get structured UI data using RSB.GetUIData
    const uiData = RSB.GetUIData(draft.template, propDef);
    const { control, label } = u_DecodeUIData(uiData);

    if (control === 'unknown') {
      LOG(`%cpropDef=${propDef} is missing control/type property`, 'color: red');
    }

    // Switch on control type from _ui metadata
    switch (control) {
      case 'in-string':
      case 'in-text':
        return <TextInput propDef={propDef} key={inputKey} />;
      case 'in-number':
      case 'in-integer':
      case 'in-boolean':
      case 'in-password':
      case 'in-select':
      case 'in-timestamp':
        LOG(...PR(`Rendering ${control} for property ${p}`), { uiData });
        return (
          <div key={inputKey}>
            {label}
            <div style={{ float: 'right' }}>[{control}]</div>
          </div>
        );
      // Fallback to legacy data types for backward compatibility
      case 'text':
      case 'string':
        return <TextInput propDef={propDef} key={inputKey} />;
      case 'number':
      case 'integer':
      case 'boolean':
      case 'password':
      case 'select':
      case 'timestamp':
        return (
          <div key={inputKey}>
            {label}
            <div style={{ float: 'right' }}>[input-{control}]</div>
          </div>
        );
      case 'composite':
        // return <CompositeInput propDef={propDef} key={inputKey} />;
        return <div key={inputKey}>Composite Input for {p}</div>;
      default:
        LOG(...PR(`Unsupported control type ${control} for property ${p}`));
        return <p key={inputKey}>Unsupported control: {control}</p>;
    }
  });

  return (
    <div key={key} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader propLabel={grpTitle} />
        </summary>
        {grpDesc && <p style={{ color: 'gray', fontStyle: 'italic' }}>{grpDesc}</p>}
        {PropertyList}
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
