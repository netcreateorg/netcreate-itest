/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
import CompositeInput from './MURCompositeInput';
import ArrayInput from './MURArrayInput';
import BooleanInput from './MURBooleanInput';
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
/** extract group props data for property group rendering */
function u_ExtractGroupProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName } = controlData;
  const { sourceMeta, sourceData } = controlData;

  const { _control, label, tooltip, help } = sourceMeta;
  const { labelKey, tooltipKey, helpKey, valueKey } = sourceMeta;

  // resolve useful ui data using fallthrough assignment
  let fControl, fLabel, fHelp, fTooltip;

  if (labelKey) fLabel = sourceData[labelKey];
  if (!fLabel) fLabel = label || propName || '<no label found>';

  if (helpKey) fHelp = sourceData[helpKey];
  if (!fHelp) fHelp = help || '';

  if (tooltipKey) fTooltip = sourceData[tooltipKey];
  if (!fTooltip) fTooltip = tooltip || '';

  fControl = _control || `<missing control prop>`;
  if (_control === undefined) {
    LOG(
      `%cWarning: '_control' is undefined for controlData=`,
      'color: red',
      JSON.stringify(controlData)
    );
    fControl = 'unknown'; // default to unknown if not specified
  }

  return {
    groupName,
    propName,
    _control: fControl,
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
    // skip _control and other internal properties
    if (p.startsWith('_')) return null;

    // Get structured control data using RSB.GetDataForProp
    const propDef = RSB.EncodePropDef(groupName, p);
    const inputKey = `in_${propDef}`;
    const controlData = RSB.GetDataForProp(draft.template, propDef);
    const { _control, label } = u_ExtractGroupProps(controlData);

    // skip disabled controls
    if (_control.startsWith('//')) {
      LOG('.. %cskipping disabled control:', 'color: blue', p);
      return null;
    }

    // Switch on control type from _ui metadata
    switch (_control) {
      case 'in_string':
      case 'in_text':
        return <TextInput propDef={propDef} key={inputKey} />;
      case 'in_boolean':
        return <BooleanInput propDef={propDef} key={inputKey} />;
      case 'in_number':
      case 'in_integer':
      case 'in_password':
      case 'in_timestamp':
        LOG(...PR(`Rendering ${_control} for property ${p}`), { controlData });
        return (
          <div key={inputKey}>
            {label}
            <div style={{ float: 'right' }}>[{_control}]</div>
          </div>
        );
      case 'composite':
        return <CompositeInput propDef={propDef} key={inputKey} />;
      case 'array':
        return <ArrayInput propDef={propDef} key={inputKey} />;
      default:
        LOG(...PR(`Unsupported control type ${_control} for property ${p}`));
        return <p key={inputKey}>Unsupported control: {_control}</p>;
    }
  });

  /// RENDER ///

  return (
    <div key={key} style={{ margin: '1rem' }}>
      <details>
        <summary>
          <GroupHeader propLabel={grpTitle} />
          {grpDesc && (
            <p style={{ color: 'gray', fontStyle: 'italic', marginTop: '0.25rem' }}>
              {grpDesc}
            </p>
          )}
        </summary>
        {PropertyList}
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
