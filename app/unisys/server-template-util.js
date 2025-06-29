/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const TOML = require('@iarna/toml');
const FSE = require('fs-extra');
const PROMPTS = require('../system/util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.Pad('Template');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// UI metadata control types have these required properties.
const CONTROL_TYPES = {
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
  in_array: {
    _type: 'string',
    label: 'string',
    tooltip: 'string',
    help: 'string'
  },
  composite: {}
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Special types used in the template schema, used for arrays of object types
/// like in `commentTypes`, `nodeDefs.types`, and `edgeDefs.types`.
const SPECIAL_TYPES = {
  commentType: { slug: 'string', label: 'string', prompts: 'string[]' },
  nodeType: { label: 'string', color: 'string' },
  edgeType: { label: 'string', color: 'string' }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///
const NODEDEFS_20 = {
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
const EDGEDEFS_20 = {
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Templates _schemaVersion "2.0" have these required keys and types
const KEYS_20 = {
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
  nodeDefs: NODEDEFS_20,
  edgeDefs: EDGEDEFS_20
};

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let VALID = [];
let INVALID = [];
let EXTRA = [];
let MISSING = [];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_type(obj) {
  if (Array.isArray(obj)) {
    return `array`;
  }
  return typeof obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Validate a single property against the expected type or structure
 *  as a recursive function. tObj is the template (sub)object being
 *  inspected */
function m_ValidateProperty(tObj, path, expected) {
  const type = u_type(tObj);
  if (type === 'string') {
    // Simple type check
    if (tObj === undefined) {
      MISSING.push(`${path} : undefined (sub)template object`);
    } else {
      if (expected.endsWith('[]') && type !== 'array') {
        INVALID.push(`${path} : expected ${expected}, got ${type}`);
      } else if (expected !== type) {
        INVALID.push(`${path} : expected ${expected}, got ${type}`);
      } else {
        VALID.push(path);
      }
    }
    return;
  }
  // Recursive object check
  if (typeof expected === 'object' && expected !== null) {
    if (tObj === undefined) {
      MISSING.push(`${path} : undefined (sub)template object`);
      return;
    }
    // Check object properties
    for (const [key, expectedType] of Object.entries(expected)) {
      const newPath = path ? `${path}.${key}` : key;
      if (newPath !== '_ui') m_ValidateProperty(tObj[key], newPath, expectedType);
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Recursively validate UI properties in the _ui metadata, pushing
 *  any issues to the respective arrays. This checks for control types
 *  and their required fields, as well as nested composite controls. */
function m_ValidateUIProperties(uiObj, path) {
  if (uiObj.control) {
    const controlType = uiObj.control;
    if (CONTROL_TYPES[controlType]) {
      const expectedFields = CONTROL_TYPES[controlType];
      m_ValidateProperty(uiObj, path, expectedFields);
    } else {
      EXTRA.push(`${path}.control : unknown-type ${controlType}`);
    }
  }
  // Check for composite controls with nested fields
  if (uiObj.control === 'composite') {
    for (const [fieldName, fieldDef] of Object.entries(uiObj)) {
      if (fieldName !== 'control' && typeof fieldDef === 'object') {
        m_ValidateUIProperties(fieldDef, `${path}.${fieldName}`);
      }
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Validate the TOML template structure against the schema. Return
 *  an object with arrays of valid, invalid, extra, and missing keys. */
function m_Validate(template) {
  // reset validation arrays
  VALID = [];
  INVALID = [];
  EXTRA = [];
  MISSING = [];

  // FIRST: Validate global keys
  m_ValidateProperty(template, '', KEYS_20);

  // NEXT: Validate _ui metadata structure
  if (template._ui) {
    // Validate _ui structure
    for (const [groupName, groupDef] of Object.entries(template._ui)) {
      const uiPath = `_ui.${groupName}`;
      if (groupName.startsWith('_editor')) {
        // Editor group metadata - just validate it exists
        VALID.push(uiPath);
      } else if (typeof groupDef === 'object' && groupDef.control) {
        // Direct UI property definition
        m_ValidateUIProperties(groupDef, uiPath);
      } else if (typeof groupDef === 'object') {
        // Nested group (like nodeDefs, edgeDefs)
        for (const [propName, propDef] of Object.entries(groupDef)) {
          const propPath = `${uiPath}.${propName}`;
          if (typeof propDef === 'object' && propDef.control) {
            m_ValidateUIProperties(propDef, propPath);
          }
        }
      }
    }
  } else {
    MISSING.push('_ui : missing UI metadata');
    console.log('template', template);
  }
  const templateOK =
    INVALID.length === 0 && EXTRA.length === 0 && MISSING.length === 0;
  return { VALID, INVALID, EXTRA, MISSING, templateOK };
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Return a report of validation results { templateOK, report }
 *  This is useful for logging or displaying in the UI. */
function ValidateTemplateObject(template) {
  if (typeof template !== 'object' || template === null) {
    console.log(PR, 'ValidateTemplateObject called with invalid template:', template);
    return [false, 'Invalid template object'];
  }
  m_Validate(template);
  let report = '';
  if (INVALID.length > 0) {
    report += `*** INVALID TEMPLATE KEYS ***\n`;
    report += `    ${INVALID.join('\n    ')}\n\n`;
  }
  if (EXTRA.length > 0) {
    report += `*** EXTRA TEMPLATE KEYS ***\n`;
    report += `    ${EXTRA.join('\n    ')}\n\n`;
  }
  if (MISSING.length > 0) {
    report += `*** MISSING TEMPLATE KEYS ***\n`;
    report += `    ${MISSING.join('\n    ')}\n\n`;
  }
  if (VALID.length > 0) {
    report += `*** VALID TEMPLATE KEYS ***\n`;
    report += `    ${VALID.length} valid keys found\n`;
  }
  const templateOK =
    INVALID.length === 0 && EXTRA.length === 0 && MISSING.length === 0;
  return [templateOK, report];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Validate a TOML template file at the given path.
 *  Returns [templateOK, report] where templateOK is a boolean
 *  and report is a string with validation results. */
function ValidateTOMLTemplate(templatePath) {
  let template;
  try {
    const content = FSE.readFileSync(templatePath, 'utf8');
    template = TOML.parse(content);
  } catch (err) {
    console.error(`Error reading or parsing template at ${templatePath}:`, err);
    return [false, `Error reading template: ${err.message}`];
  }
  const [templateOK, report] = ValidateTemplateObject(template);
  return [templateOK, report];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  m_Validate,
  ValidateTOMLTemplate,
  ValidateTemplateObject
};
