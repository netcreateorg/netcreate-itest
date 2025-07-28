/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Composite Group Component
  Recursive component for rendering nested property groups and composites
  To implemente

  TODO: modify MURSettingEditor to use this component instead of
  MURPropertyGroup when ready to implement. This will simplify the
  template rendering system.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
import TextInput from './MURTextInput';
import ArrayInput from './MURArrayInput';
import BooleanInput from './MURBooleanInput';
import ColorGroup from './MURColorGroup';
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('CompositeGroup', 'TagBlue');

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
/** HELPER: Extract UI properties using fallthrough assignment pattern */
function u_ExtractUIProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName } = controlData;
  const { sourceMeta, sourceData } = controlData;

  const { _control, label, tooltip, help } = sourceMeta;
  const { labelKey, tooltipKey, helpKey } = sourceMeta;

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
    fControl = 'unknown';
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Render input component based on control type and propDef */
function u_RenderControlInput(_control, propDef, key) {
  if (_control === 'in_string' || _control === 'in_text') {
    return <TextInput propDef={propDef} key={key} />;
  } else if (_control === 'in_boolean') {
    return <BooleanInput propDef={propDef} key={key} />;
  } else if (_control === 'composite') {
    return <CompositeGroup propDef={propDef} key={key} />;
  }

  if (_control === 'in_colorgroup') {
    return <ColorGroup propDef={propDef} key={key} />;
  } else if (_control.startsWith('//')) {
    if (DBG) LOG('.. %cskipping disabled control:', 'color: blue', propDef);
    return null;
  } else if (_control === 'in_array') {
    return <ArrayInput propDef={propDef} key={key} />;
  }

  LOG(...PR(`Unsupported control type ${_control} for propDef ${propDef}`));
  return <p key={key}>Unsupported control: {_control}</p>;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Get property names from group or composite source */
function u_GetPropertyNames(propDef, draft) {
  const { template } = draft;
  const metaSource = template._ui || {};

  if (!propDef || propDef === '') {
    // Root level: get global properties
    return RSB.GetUISettingsList(metaSource).globalsList || [];
  }

  // Get control data for this propDef
  const controlData = RSB.GetDataForProp(template, propDef);
  if (!controlData || !controlData.sourceMeta) return [];

  // Extract property names from sourceMeta, excluding metadata properties
  return Object.keys(controlData.sourceMeta).filter(p => !p.startsWith('_'));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Get group metadata for title and description */
function u_GetGroupMeta(propDef, draft) {
  const metaSource = template._ui || {};

  if (!propDef || propDef === '') {
    // Root level: use global _groupMeta
    return (
      metaSource._groupMeta || {
        label: '<global groupMeta not in template>',
        description: ''
      }
    );
  }

  // For composite properties, get metadata from controlData
  const controlData = RSB.GetDataForProp(draft.pending || draft.template, propDef);
  if (!controlData) {
    return { label: '<no metadata found>', description: '' };
  }

  const { propName } = controlData;
  const { sourceMeta } = controlData;
  const groupMeta = sourceMeta._groupMeta || {};

  return {
    label: groupMeta.label || propName || '<title not set>',
    description: groupMeta.description || ''
  };
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Recursive component for rendering property groups and composites.
 *  Accepts either groupName (legacy) or propDef for nested rendering */
function CompositeGroup(props) {
  const { groupName, propDef } = props;
  const { draft } = React.useContext(RSB.SettingsContext);

  // Determine effective propDef: use propDef if provided, else convert groupName
  let effectivePropDef;
  if (propDef) {
    effectivePropDef = propDef;
  } else if (groupName) {
    effectivePropDef = groupName;
  } else {
    effectivePropDef = ''; // root level
  }

  // Get property names to render
  const propNames = u_GetPropertyNames(effectivePropDef, draft);

  // Get group metadata for header
  const groupMeta = u_GetGroupMeta(effectivePropDef, draft);
  const grpTitle = groupMeta.label;
  const grpDesc = groupMeta.description;

  // Generate unique key for this group
  const key = `cg-${effectivePropDef || 'root'}`;

  LOG(
    `%cCompositeGroup: %c${effectivePropDef || 'root'} %c(${propNames.length} props)`,
    'color: green',
    'color: blue',
    'color: gray'
  );

  /// SUB RENDER ///

  const PropertyList = propNames.map(p => {
    if (p.startsWith('_')) return null;

    // Build child propDef by extending parent
    let childPropDef;
    if (!effectivePropDef || effectivePropDef === '') {
      childPropDef = RSB.EncodePropDef(p);
    } else {
      // Decode parent propDef and append new property
      const decoded = RSB.DecodePropDef(effectivePropDef);
      if (decoded.propName) {
        // Parent is composite property, append field
        childPropDef = RSB.EncodePropDef(decoded.groupName, decoded.propName, p);
      } else {
        // Parent is group, append property
        childPropDef = RSB.EncodePropDef(decoded.groupName, p);
      }
    }

    const inputKey = `in_${childPropDef}`;
    const controlData = RSB.GetDataForProp(draft.template, childPropDef);
    const { _control } = u_ExtractUIProps(controlData);

    LOG(
      `%cCompositeGroup child: %c${childPropDef} %c(${_control})`,
      'color: green',
      'color: blue',
      'color: gray'
    );

    return u_RenderControlInput(_control, childPropDef, inputKey);
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
module.exports = CompositeGroup;
