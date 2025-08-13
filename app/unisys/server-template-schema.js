/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Schema Definitions for NetCreate Template Validation

  This module contains all the schema definitions and reference data
  structures used for validating TOML template files.

  // TODO

  There is related discussion
  github.com/netcreateorg/netcreate-itest/pull/414#issuecomment-3085969754

  There are four "types" of NodeDefs and EdgeDefs fields that we need to support:
  - required fields like id, node label, etc.
  - built-in metadata fields like revision, created, modified that are created
    and modified by loki
  - built-in "optional" metadata fields like degrees, createdBy that can be
    hidden, but have functionality built into the NCNode/NCEdge editors
  - "custom/optional" fields that can be added and changed and removed
    like info, and notes

  In the current implementation of Template Validation, the "custom/optional"
  cannot be removed or added. e.g. if I decided that I want to add a NodeDef url
  field and remove the info field, .nc-validate will complain and the project
  cannot be run without disabling USE_VALIDATOR (in server-database)

  WORKAROUND: The validator ignores EXTRA keys in its templateOK return status

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// UI CONTROL SCHEMAS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// UI metadata control types have specific ui properties. These properties are
/// used to render the UI form elements as defined by:
/// { [fieldName]:{ _control, ...ui_properties }}
/// the '_control' property is excluded from the check
const CONTROL_SCHEMA = {
  in_string: {
    label: 'string',
    tooltip: 'string',
    help: 'string'
  },
  in_boolean: {
    label: 'string',
    tooltip: 'string',
    help: 'string'
  },
  in_number: {
    label: 'string',
    tooltip: 'string',
    help: 'string'
  },
  in_select: {
    label: 'string',
    tooltip: 'string',
    help: 'string',
    options: 'object[]'
  },
  // contains a in_composite control with nested fields
  // { _control:'in_composite', [fieldName]:{ _control, ...ui_properties }}
  in_composite: {}
};

/// OBJECT TYPE SCHEMAS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Special types used in the template schema, used for arrays of object types
/// like in `commentTypes`, `nodeDefs.types`, and `edgeDefs.types`.
const OBJS_SCHEMA20 = {
  commentType: { slug: 'string', label: 'string', prompts: 'promptType[]' },
  promptType: {
    format: 'string',
    prompt: 'string',
    help: 'string',
    feedback: 'string'
  },
  colorOption: { label: 'string', color: 'string' },
  nodeType: { label: 'string', color: 'string' },
  edgeType: { label: 'string', color: 'string' }
};

/// BASIC TYPE SCHEMAS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Basic types used in the template schema for 'type' fields in template.
/// Note these are not the same as the 'type' defined in the application
/// components (e.g. NCNode, NCEdge, etc.) which is the NCUI system.
/// This is the UI for editing that UI system, not the NCUI System itself.
const TYPES_SCHEMA20 = [
  // basic types
  'string',
  'number',
  'boolean',
  'composite',
  'array'
];
/// extended types used in the template schema
TYPES_SCHEMA20.push(...Object.keys(OBJS_SCHEMA20));
TYPES_SCHEMA20.push(...Object.keys(OBJS_SCHEMA20).map(key => `${key}[]`));

/// RUNTIME EXTRAS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Known runtime properties that are not in the schema but are expected
const EXTRAS20 = {
  nodeDefs: ['comments'],
  edgeDefs: ['info', 'comments', 'sourceLabel', 'targetLabel']
};

/// NODE DEFINITION SCHEMA ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NODES_SCHEMA20 = {
  id: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  label: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  type: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean',
    options: 'nodeType[]'
  },
  description: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  othertext: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  sometype: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean',
    options: 'nodeType[]'
  },
  somenumber: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  citation: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  infoOrigin: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  created: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    hidden: 'boolean'
  },
  createdBy: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    hidden: 'boolean'
  },
  updated: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    hidden: 'boolean'
  },
  updatedBy: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    hidden: 'boolean'
  },
  degrees: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  revision: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    hidden: 'boolean'
  }
};

/// EDGE DEFINITION SCHEMA ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EDGES_SCHEMA20 = {
  id: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  source: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  target: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    hidden: 'boolean'
  },
  type: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean',
    options: 'edgeType[]'
  },
  description: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  sometype: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean',
    options: 'edgeType[]'
  },
  citation: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  infoOrigin: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  othertext: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  created: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    hidden: 'boolean'
  },
  createdBy: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    hidden: 'boolean'
  },
  updated: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    hidden: 'boolean'
  },
  updatedBy: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    hidden: 'boolean'
  },
  weight: {
    type: 'string',
    defaultValue: 'number',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isRequired: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  revision: {
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    hidden: 'boolean'
  }
};

/// MAIN TEMPLATE SCHEMA //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Templates have these required keys
const TEMPLATE_SCHEMA = {
  // global keys
  _schemaVersion: 'string',
  name: 'string',
  description: 'string',
  secretKey: 'string',
  adminPassword: 'string',
  requireLogin: 'boolean',
  hideDeleteNodeButton: 'boolean',
  allowLoggedInUserToImport: 'boolean',
  nodeSizeDefault: 'number',
  nodeSizeMax: 'number',
  edgeSizeDefault: 'number',
  edgeSizeMax: 'number',
  filterFade: 'string',
  filterFadeHelp: 'string',
  filterReduce: 'string',
  filterReduceHelp: 'string',
  filterFocus: 'string',
  filterFocusHelp: 'string',
  duplicateWarning: 'string',
  duplicationWarning: 'string',
  nodeIsLockedMessage: 'string',
  edgeIsLockedMessage: 'string',
  templateIsLockedMessage: 'string',
  importIsLockedMessage: 'string',
  nodeDefaultTransparency: 'number',
  edgeDefaultTransparency: 'number',
  searchColor: 'string',
  sourceColor: 'string',
  citation: { text: 'string', hidden: 'boolean' },
  // composite keys
  commentTypes: 'commentType[]',
  nodeDefs: NODES_SCHEMA20,
  edgeDefs: EDGES_SCHEMA20
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  CONTROL_SCHEMA,
  OBJS_SCHEMA20,
  TYPES_SCHEMA20,
  EXTRAS20,
  NODES_SCHEMA20,
  EDGES_SCHEMA20,
  TEMPLATE_SCHEMA
};
