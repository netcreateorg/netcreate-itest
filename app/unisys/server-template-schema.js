/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Schema Definitions for NetCreate Template Validation

  This module contains all the schema definitions and reference data
  structures used for validating TOML template files.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// UI CONTROL SCHEMAS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// UI metadata control types have specific ui properties. These properties are
/// used to render the UI form elements as defined by:
/// { [fieldName]:{ control, ...ui_properties }}
/// the 'control' property is excluded from the check
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
  // contains a composite control with nested fields
  // { control:'composite', [fieldName]:{ control, ...ui_properties }}
  composite: {}
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
  nodeType: { label: 'string', color: 'string' },
  edgeType: { label: 'string', color: 'string' }
};

/// BASIC TYPE SCHEMAS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Basic types used in the template schema for 'type' fields in template
const TYPES_SCHEMA20 = [
  // basic types
  'string',
  'number',
  'boolean',
  // extended types
  'select',
  'timestamp',
  'weight',
  'infoOrigin',
  'node'
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
  notes: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  info: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  infoSource: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isProvenance: 'boolean',
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
  notes: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  weight: {
    type: 'string',
    defaultValue: 'number',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    includeInGraphTooltip: 'boolean',
    isRequired: 'boolean',
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
  citation: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    help: 'string',
    isProvenance: 'boolean',
    hidden: 'boolean'
  },
  category: {
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
    includeInGraphTooltip: 'boolean',
    help: 'string',
    hidden: 'boolean'
  },
  createdBy: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    includeInGraphTooltip: 'boolean',
    help: 'string',
    hidden: 'boolean'
  },
  updated: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    includeInGraphTooltip: 'boolean',
    help: 'string',
    hidden: 'boolean'
  },
  updatedBy: {
    type: 'string',
    displayLabel: 'string',
    exportLabel: 'string',
    includeInGraphTooltip: 'boolean',
    help: 'string',
    hidden: 'boolean'
  },
  revision: {
    displayLabel: 'string',
    exportLabel: 'string',
    includeInGraphTooltip: 'boolean',
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
