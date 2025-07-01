/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const TOML = require('@iarna/toml');
const FSE = require('fs-extra');
const PROMPTS = require('../system/util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.Pad('Template');
const LOG = console.log.bind(console);
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GRY = '\x1b[90m'; // grey
const RED = '\x1b[1;31m'; // red
const CRT = '\x1b[1;37;41m'; // critical
const NRM = '\x1b[0m'; // nrm
const _err = str => `${RED}* ${str}${NRM}`; // bad
const _ok = str => `${GRN}. ${str}${NRM}`; // good
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// UI metadata control types have specifi ui properties. These properties are
/// used to render the UI form elements as defined by:
/// { [fieldName]:{ control, ...ui_properties }}
/// the 'control' property is excluded from the check
const CHECK_CONTROLS = {
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Special types used in the template schema, used for arrays of object types
/// like in `commentTypes`, `nodeDefs.types`, and `edgeDefs.types`.
const CHECK_OBJS20 = {
  commentType: { slug: 'string', label: 'string', prompts: 'string[]' },
  nodeType: { label: 'string', color: 'string' },
  edgeType: { label: 'string', color: 'string' }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Basic types used in the template schema for 'type' fields in template
const T_ALLOWED20 = [
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
T_ALLOWED20.push(...Object.keys(CHECK_OBJS20));
T_ALLOWED20.push(...Object.keys(CHECK_OBJS20).map(key => `${key}[]`));
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///
const CHECK_NODES20 = {
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
const CHECK_EDGES20 = {
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
/// Templates have these requires keys
const CHECK20 = {
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
  nodeDefs: CHECK_NODES20,
  edgeDefs: CHECK_EDGES20
};

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let VALID = []; // valid keys found in the template
let INVALID = []; // invalid keys found in the template
let EXTRA = []; // extra keys found in the template that are not in the schema
let MISSING = []; // missing keys in the template that are required by the schema
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extended typeof to handle arrays */
function u_typeof(obj) {
  if (Array.isArray(obj)) {
    return `array`;
  }
  return typeof obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the object is a simple value type */
const value_types = ['string', 'number', 'boolean'];
function is_valueType(obj) {
  const type = u_typeof(obj);
  return value_types.includes(type);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return checkObj type as [u_typeof] or ['array','<itemType>'] */
function get_checkType(checkObj) {
  if (typeof checkObj === 'string') {
    // checkObj is an array type, so return item type
    if (checkObj.endsWith('[]')) {
      const itemType = checkObj.slice(0, -2); // remove '[]'
      return ['array', itemType];
    }
  }
  // if checkObj is anything else return the found type
  return [u_typeof(checkObj)];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Validate a single property against the checkObj type or structure
 *  as a recursive function. Adds results to the global arrays:
 *  VALID, INVALID, EXTRA, and MISSING.
 *  !!! Handles only properties, not ui metadata !!!
 *  @param {string} tKey - The current key used to get template object
 *  @param {string|object} tObj - The template object found at key index
 *  @param {string|object} checkObj - the validation object
 */
function m_ValidateProperty(tKey, tObj, checkObj) {
  // simple value types can be checked directly
  if (DBG) {
    const jst = JSON.stringify(tObj).substring(0, 20);
    const cst = JSON.stringify(checkObj).substring(0, 20);
    // console.log(`${GRY}Validating '${tKey}' ${NRM}${jst}${GRY}  type ${NRM}${cst}`);
  }
  const tobjType = u_typeof(tObj);
  const [checkType, itemType] = get_checkType(checkObj);
  if (checkType === undefined) {
    const err = `! ${tKey} : checkObj is undefined!`;
    throw Error(`unexpected undefined checking object passed to validator`);
  }

  // (1) first handle simple value types in the template
  if (is_valueType(tObj)) {
    if (tObj === undefined) {
      const err = `* ${tKey} : undefined value`;
      if (DBG) LOG(err);
      INVALID.push(err);
      return;
    }
    // special case for 'type' keys
    if (tKey === 'type') {
      if (tobjType !== 'string') {
        const err = `* ${tKey} : expected 'string', not <${tObjType}>`;
        if (DBG) LOG(err);
        INVALID.push(err);
        return;
      }
      if (!T_ALLOWED20.includes(tObj)) {
        const err = `* ${tKey} : unknown template type "${tObj}". Check T_ALLOWED20`;
        if (DBG) LOG(err);
        INVALID.push(err);
        return;
      }
    }
    // got here? then it's just a number, or boolean
    const ok = `. ${tKey} : valid simple value <${u_typeof(tObj)}>`;
    if (DBG) LOG(ok);
    VALID.push(ok);
    return;
  }

  // (2) it's an array type
  if (tobjType === 'array') {
    if (itemType === undefined) {
      const cTypes = Object.keys(CHECK_OBJS20)
        .map(key => CHECK_OBJS20[key] + '[]')
        .join(' | ');
      const err = `* ${tKey} : array types must be one of ${cTypes.join(', ')}`;
      if (DBG) LOG(err);
      INVALID;
      return;
    }
    const checkArray = CHECK_OBJS20[itemType];
    LOG(`${GRY}TODO '${tKey}' array check vs:`, checkArray, NRM);
    // LOG(`data to check:`, JSON.stringify(tObj));
    return;
  }

  // (3) by now, we expect that tObj is an iterable object
  if (tobjType !== 'object') {
    const err = `* ${tKey} : expected object, not ${tobjType}`;
    if (DBG) LOG(err);
    INVALID.push(err);
    return;
  }
  // if we got here recurse the keys of the tObj
  const tobjKeys = Object.keys(tObj).filter(key => !key.startsWith('_'));
  tobjKeys.forEach(key => {
    const subcheck = checkObj[key];
    if (subcheck === undefined) {
      const err = `* ${tKey}.${key} : key not found in template schema`;
      if (DBG) LOG(err);
      EXTRA.push(err);
      return;
    }
    const subtobj = tObj[key];
    if (subtobj === undefined) {
      const err = `* ${tKey}.${key} : property not found in template`;
      if (DBG) LOG(err);
      MISSING.push(err);
      return;
    }
    // sub check passed, so recurse!
    m_ValidateProperty(key, subtobj, subcheck);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Recursively validate UI properties in the _ui metadata, pushing
 *  any issues to the respective arrays. This checks for control types
 *  and their required fields, as well as nested composite controls. */
function m_ValidateUIProperties(uiObj, tKey = '_ui') {
  // walk all the top-level keys of _ui
  for (const [key, uiDef] of Object.entries(uiObj)) {
    // skip internal keys
    if (key.startsWith('_')) continue;
    const pkey = tKey ? `${tKey}.${key}` : key;
    // check if this key is actually in the schema
    if (!CHECK20[key]) {
      const err = `* ${pkey} : unknown key in _ui`;
      if (DBG) LOG(err);
      EXTRA.push(err);
      continue;
    }
    // we have a valid ui key, now check its control type
    if (!uiDef.control) {
      if (DBG) LOG(`* ui invalid control type in _ui.${key}`);
      INVALID.push(`${pkey} : missing control type in _ui.${key}`);
      continue;
    }
    // check if the control type is valid
    if (!CHECK_CONTROLS[uiDef.control]) {
      if (DBG) LOG(`* ui invalid control type in _ui.${key}`);
      INVALID.push(`${pkey} : invalid control type '${uiDef.control}' in _ui.${key}`);
      continue;
    }
    // make sure this isn't a composite control
    if (uiDef.control === 'composite') {
      if (DBG) LOG(`> ui Composite control found in _ui.${key}, skipping validation`);
      continue;
    }
    // if we got here, get in_string: { label, tooltip, help }
    const controlProps = CHECK_CONTROLS[uiDef.control];
    // these are the UI form elements, not the data itself
    // a general idea is that if the controlProp property names
    // end with 'key', they are a reference to something in the
    // template, not the UI metadata itself.
    const keys = Object.keys(controlProps);
    for (const prop of keys) {
      if (prop.endsWith('key')) {
        // see if it exists in template schema
        const propName = prop.slice(0, -3); // remove 'key'
        if (!CHECK20[key][propName]) {
          if (DBG) LOG(`* ui ${key} : ${prop} does not exist in template schema`);
          INVALID.push(
            `${tKey}${key}.${prop} : missing property '${propName}' in template schema`
          );
          continue;
        }
        if (DBG) LOG('. ui valid key prop', `${tKey}${key}.${prop}`);
        VALID.push(`${tKey}${key}.${prop}`);
        continue;
      }
      // if got here, prop doesn't end with 'key' so check ui data
      if (uiDef[prop] === undefined) {
        if (DBG) LOG(`* ui missing property in _ui.${key} : ${prop}`);
        MISSING.push(`${tKey}${key}.${prop} : missing property in _ui.${key}`);
        continue;
      }
      // if got here, uiDef[prop] exists so check type
      const expectedType = controlProps[prop];
      const actualType = u_typeof(uiDef[prop]);
      if (expectedType.endsWith('[]')) {
        // checkObj an array, so check if it's an array
        if (actualType !== 'array') {
          if (DBG) LOG(`* ui checkObj array definition in _ui.${key}.${prop}`);
          INVALID.push(
            `${tKey}${key}.${prop} : checkObj ${expectedType}, got ${actualType}`
          );
        } else {
          if (DBG) LOG('* ui valid array', `${tKey}${key}.${prop}`);
          VALID.push(`${tKey}${key}.${prop}`);
        }
        continue;
      }
      // if got here, expectedType is a simple type
      if (actualType !== expectedType) {
        if (DBG) LOG(`* ui checkObj ${expectedType} in _ui.${key}.${prop}`);
        INVALID.push(
          `${tKey}${key}.${prop} : checkObj ${expectedType}, got ${actualType}`
        );
        continue;
      }
      // if got here, it's a valid simple property
      if (DBG) LOG('. ui valid simple prop', `${tKey}${key}.${prop}`);
      VALID.push(`${tKey}${key}.${prop}`);
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
  m_ValidateProperty('', template, CHECK20);

  // NEXT: Validate _ui metadata structure
  if (template._ui) {
    m_ValidateUIProperties(template._ui, '');
  } else {
    MISSING.push('_ui : missing UI metadata');
    console.log(`${CRT}* missing _ui metadata in template${NRM}`);
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
  if (VALID.length > 0) {
    report += `### VALID TEMPLATE KEYS ###\n`;
    report += `    ${VALID.length} valid keys found\n`;
  }
  if (INVALID.length > 0) {
    report += `### INVALID TEMPLATE KEYS ###\n`;
    report += `    ${INVALID.join('\n    ')}\n`;
  }
  if (EXTRA.length > 0) {
    report += `### EXTRA TEMPLATE KEYS ###\n`;
    report += `    ${EXTRA.join('\n    ')}\n`;
  }
  if (MISSING.length > 0) {
    report += `### MISSING TEMPLATE KEYS ###\n`;
    report += `    ${MISSING.join('\n    ')}\n`;
  }
  const templateOK =
    INVALID.length === 0 && EXTRA.length === 0 && MISSING.length === 0;

  return [
    templateOK,
    report,
    { valid: VALID, invalid: INVALID, extra: EXTRA, missing: MISSING }
  ];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Validate a TOML template file at the given tKey.
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
  const [templateOK, report, logObject] = ValidateTemplateObject(template);
  return [templateOK, report, logObject];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  m_Validate,
  ValidateTOMLTemplate,
  ValidateTemplateObject
};
