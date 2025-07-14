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
function u_DecodeUIData(uiObj) {
  if (typeof uiObj !== 'object')
    return { error: `arg1 must be an object, got ${typeof uiObj}` };

  const { groupName, propName, propMeta, propData } = uiObj;
  const { control, label, tooltip, help } = propMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = propMeta;

  // resolve useful ui data using fallthrough assignment
  let fControl, fLabel, fHelp, fTooltip;

  if (labelKey) fLabel = propData[labelKey];
  if (!fLabel) fLabel = label || propName || '<no label found>';

  if (helpKey) fHelp = propData[helpKey];
  if (!fHelp) fHelp = help || '';

  if (tooltipKey) fTooltip = propData[tooltipKey];
  if (!fTooltip) fTooltip = tooltip || '';

  fControl = control || `<missing control prop>`;
  if (control === undefined) {
    LOG(
      `%cWarning: 'control' is undefined for uiObj=`,
      'color: red',
      JSON.stringify(uiObj)
    );
    fControl = 'unknown'; // default to unknown if not specified
  }

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
  // which are derived by scanning metaSource which is the groupMeta
  // dictionary that determines what the UI should display

  let propNames; // array of property names to display
  let propsData = {}; // derived data for rendering ui, not directly from template

  if (groupName === '') {
    /// CASE 1: NO GROUP NAME, ONLY PROP NAME AVAILABLE ///
    propNames = RSB.GetUISettingsList(metaSource).globalsList || [];
    propNames.forEach(p => (propsData[p] = metaSource[p]));
    propsData._src = '';
    if (metaSource._groupMeta) {
      propsData._groupMeta = metaSource._groupMeta;
    } else {
      propsData._groupMeta = {
        label: '<global groupMeta not in template>',
        description: ''
      };
    }
  } else {
    /// CASE 2: GROUP NAME AND PROP NAME AVAIABLE ///
    propsData = { ...(metaSource[groupName] || draft.template[groupName] || {}) };
    propsData._src = groupName;
    propNames = Object.keys(propsData).filter(p => p.startsWith('_') === false);
  }

  // look for title in _groupMeta
  let groupMeta = {};
  if (groupName === '') {
    // For global settings, use _groupMeta directly
    groupMeta = propsData._groupMeta || {};
  } else {
    // For named groups, use _groupMeta[groupName] from metaSource
    groupMeta =
      (metaSource._groupMeta && metaSource._groupMeta[groupName]) ||
      propsData[groupName] ||
      {};
  }
  const grpTitle = groupMeta.label || groupName.toUpperCase() || '<title not set>';
  const grpDesc = groupMeta.description || '';
  const key = `pg-${groupName}`;

  /// SUB RENDER ///

  const PropertyList = propNames.map(p => {
    // skip control and internal properties
    if (p === 'control' || p.startsWith('_')) return null;

    // Get structured UI data using RSB.GetUIData
    const propDef = RSB.EncodePropDef(groupName, p);
    const inputKey = `in_${propDef}`;
    const uiObj = RSB.GetUIData(draft.template, propDef);
    const { control, label } = u_DecodeUIData(uiObj);

    if (control === 'unknown') {
      LOG(`%cpropDef=${propDef} is missing control/type property`, 'color: red');
    }

    // Switch on control type from _ui metadata
    switch (control) {
      case 'in_string':
      case 'in_text':
        return <TextInput propDef={propDef} key={inputKey} />;
      case 'in_number':
      case 'in_integer':
      case 'in_boolean':
      case 'in_password':
      case 'in_select':
      case 'in_timestamp':
        LOG(...PR(`Rendering ${control} for property ${p}`), { uiObj });
        return (
          <div key={inputKey}>
            {label}
            <div style={{ float: 'right' }}>[{control}]</div>
          </div>
        );
      case 'composite':
        return <CompositeInput propDef={propDef} key={inputKey} />;
      // return <div key={inputKey}>Composite Input for {p}</div>;
      default:
        LOG(...PR(`Unsupported control type ${control} for property ${p}`));
        return <p key={inputKey}>Unsupported control: {control}</p>;
    }
  });

  /// RENDER ///

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
