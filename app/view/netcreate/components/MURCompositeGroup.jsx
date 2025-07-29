/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Composite Group Component
  Recursive component for rendering nested property groups and composites

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
const PR = ConsoleStyler('CGroup', 'TagPink');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { propLabel } = props;
  return <span style={{ fontWeight: 'bold', fontSize: 'larger' }}>{propLabel}</span>;
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

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Recursive component for rendering property groups and composites.
 *  Accepts propDef parameter for unified rendering */
function CompositeGroup(props) {
  let { propDef, open } = props;
  if (open === undefined) open = true; // default to open if not specified
  const { draft } = React.useContext(RSB.SettingsContext);

  // Get property names and metadata from controlData
  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const propNames =
    controlData && controlData.sourceMeta
      ? Object.keys(controlData.sourceMeta).filter(p => !p.startsWith('_'))
      : [];

  if (DBG)
    LOG(
      `%cCompositeGroup: %c${propDef || 'root'} %c(${propNames.length} props)`,
      'color: green',
      'color: blue',
      'color: gray',
      propNames
    );

  // Extract group metadata for header
  const { propName, sourceMeta } = controlData || {};
  const metaSource = draft.template._ui || {};

  let groupMeta = {};
  if (!propDef || propDef === '') {
    // Root level: use global _groupMeta
    groupMeta = (sourceMeta && sourceMeta._groupMeta) || {};
  } else {
    // Named groups: look for group metadata in _ui._groupMeta[groupName]
    groupMeta = (metaSource._groupMeta && metaSource._groupMeta[propDef]) || {};
    // LOG(...PR(`CompositeGroup: metaSource._groupMeta =`, metaSource._groupMeta));
  }

  const grpTitle =
    groupMeta.label || `[${propName}]` || `[${propDef}]` || '<title not set>';
  const grpDesc = groupMeta.description || '';

  // Generate unique key for this group
  const key = `cg-${propDef || 'root'}`;

  /// SUB RENDER ///

  const PropertyList = propNames.map(p => {
    if (p.startsWith('_')) return null;

    // Build child propDef - for root level, just use property name
    const childPropDef = propDef ? `${propDef}.${p}` : p;
    // Get control data for this child property
    const childControlData = RSB.GetDataForProp(
      draft.pending || draft.template,
      childPropDef
    );
    if (!childControlData || !childControlData.sourceMeta) return null;

    const { _control } = childControlData.sourceMeta;
    const inputKey = `in_${childPropDef}`;

    return u_RenderControlInput(_control, childPropDef, inputKey);
  });

  /// RENDER ///

  return (
    <div key={key} style={{ margin: '1rem 0.5rem' }}>
      <details open={open}>
        <summary style={{ cursor: 'pointer' }}>
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
