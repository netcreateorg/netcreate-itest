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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Known runtime properties that are not in the schema but are expected
const EXTRAS20 = {
  nodeDefs: ['comments'],
  edgeDefs: ['info', 'comments', 'sourceLabel', 'targetLabel']
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Templates have these requires keys
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

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let VALID = []; // valid keys found in the template
let INVALID = []; // invalid keys found in the template
let EXTRA = []; // extra keys found in the template that are not in the schema
let MISSING = []; // missing keys in the template that are required by the schema
let WARNINGS = []; // warnings for runtime properties that are not in the schema
let VARIES = []; // keys that don't need to match exactly (saved array items)
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
/** remove trailing dot from path if exists */
function u_noDot(path) {
  // remove trailing dot if exists
  if (path.endsWith('.')) return path.slice(0, -1);
  return path;
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
/** Helper to recursively walk template and collect found keys. As template is
 *  a Javascript object, the values stored as 'array' or typeof value type.
 *  The keyMap property is the working context for this recursive function,
 *  which has the desirable side effect of removing duplicate keys as we
 *  would find in variable options[] and prompts[] */
function r_GatherTemplateKeys(obj, keyMap, basePath = '') {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      // Handle arrays - mark the array itself as found
      const arrayPath = basePath.slice(0, -1) + '[]';
      keyMap.set(arrayPath, 'array');

      // Walk first item to find array item properties
      if (obj.length > 0) {
        r_GatherTemplateKeys(obj[0], keyMap, arrayPath + '.');
      }
    } else {
      // Handle objects
      for (const [key, value] of Object.entries(obj)) {
        // Skip metadata keys starting with '_' except _schemaVersion
        if (key.startsWith('_') && key !== '_schemaVersion') continue;

        const fullPath = basePath + key;
        keyMap.set(fullPath, typeof value);

        if (typeof value === 'object' && value !== null) {
          r_GatherTemplateKeys(value, keyMap, fullPath + '.');
        }
      }
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Helper to recursively walk an object schema. It's similar to the
 *  r_GatherTemplateKeys method, generating a usefule data structure for
 *  comparison */
function r_GatherSchemaKeys(obj, keyMap, basePath = '') {
  // strings are the format of a type declaration in the schema
  if (typeof obj === 'string') {
    // Handle array types like 'promptType[]'
    if (obj.endsWith('[]')) {
      const itemType = obj.slice(0, -2);
      const cleanPath = u_noDot(basePath);
      const arrayPath = cleanPath + '[]';
      keyMap.set(arrayPath, obj);
      // If it's a complex type, walk its properties
      if (OBJS_SCHEMA20[itemType]) {
        r_GatherSchemaKeys(OBJS_SCHEMA20[itemType], keyMap, arrayPath + '.');
      }
    } else {
      // Simple type
      keyMap.set(u_noDot(basePath), obj);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    // Walk object properties
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = basePath ? `${basePath}${key}` : key;
      keyMap.set(u_noDot(fullPath), 'object');
      r_GatherSchemaKeys(value, keyMap, fullPath + '.');
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Validate a single property against the checkObj type or structure
 *  as a recursive function. Adds results to the global arrays:
 *  VALID, INVALID, EXTRA, and MISSING.
 *  !!! Handles only properties, not ui metadata !!!
 *  @param {string} tInfo - The current path being processed
 *  @param {string|object} tObj - The template object found at key index
 *  @param {string|object} checkObj - the validation object
 */
function r_ValidateProperty(tInfo, tObj, checkObj) {
  // simple value types can be checked directly
  if (DBG) {
    const jst = JSON.stringify(tObj).substring(0, 20);
    const cst = JSON.stringify(checkObj).substring(0, 20);
    // console.log(`${GRY}Validating '${tInfo}' ${NRM}${jst}${GRY}  type ${NRM}${cst}`);
  }

  // (0) tobjType is used to determine how to process the tObj
  const tobjType = u_typeof(tObj);
  const [checkType, itemType] = get_checkType(checkObj);
  if (checkType === undefined) {
    const err = `! ${tInfo} : checkObj is undefined!`;
    throw Error(`unexpected undefined checking object passed to validator`);
  }

  // (1) first handle simple value types in the template
  if (is_valueType(tObj)) {
    if (tObj === undefined) {
      const err = `* ${tInfo} : undefined value`;
      if (DBG) LOG(err);
      INVALID.push(err);
      return;
    }
    // (1A) special case for 'type' keys
    if (tInfo === 'type') {
      // the prop value should be a string type
      if (tobjType !== 'string') {
        const err = `* ${tInfo} : expected 'string', not <${tObjType}>`;
        if (DBG) LOG(err);
        INVALID.push(err);
        return;
      }
      // check if the type is a recognized type
      if (!TYPES_SCHEMA20.includes(tObj)) {
        const err = `* ${tInfo} : unknown template type "${tObj}". Check TYPES_SCHEMA20`;
        if (DBG) LOG(err);
        INVALID.push(err);
        return;
      }
      // continue procesing by falling through
    }

    // (1B) This is a simple value type like number, string, boolean
    if (tInfo.includes('[]')) {
      const ok = `. ${tInfo} : variable item ok`;
      VARIES.push(ok);
    } else {
      const ok = `. ${tInfo} : valid simple value <${u_typeof(tObj)}>`;
      VALID.push(ok);
    }
    // (1C) finished validating simple value type, exit validator
    return;
  }

  // (2) This is an array property, so check its items
  if (tobjType === 'array') {
    if (itemType === undefined) {
      const cTypes = Object.keys(OBJS_SCHEMA20)
        .map(key => OBJS_SCHEMA20[key] + '[]')
        .join(' | ');
      const err = `* ${tInfo} : array types must be one of ${cTypes.join(', ')}`;
      LOG(err);
      INVALID.push(err);
      return;
    }
    // get the schema for this array type
    const itemSchema = OBJS_SCHEMA20[itemType]; // complex object type

    // (2A) It's a simple array of recognized value types (e.g. string, number)
    if (itemSchema === undefined && TYPES_SCHEMA20.includes(itemType)) {
      // validate each item in the simple type array
      tObj.forEach((item, index) => {
        if (item === undefined) {
          const err = `* ${tInfo}[${index}] : undefined item in array`;
          LOG(err);
          INVALID.push(err);
          return;
        }
        const actualType = u_typeof(item);
        if (actualType !== itemType) {
          const err = `* ${tInfo}[${index}] : expected ${itemType}, got ${actualType}`;
          LOG(err);
          INVALID.push(err);
        }
      });
      return; // if we got here, we validated the simple type array items so exit clause!!!
    }

    // (2B) It's an unrecognized array of value types, so log an error
    if (itemSchema === undefined) {
      const err = `* ${tInfo} : unknown array type '${itemType}'`;
      LOG(err);
      INVALID.push(err);
      return;
    }

    // (2C) It's an array of objects that should match itemSchema, so iterate over the items
    tObj.forEach((item, index) => {
      if (item === undefined) {
        const err = `* ${tInfo}[${index}] : undefined item in array`;
        LOG(err);
        INVALID.push(err);
        return;
      }
      // recursively validate each item in the array against the expected schema
      r_ValidateProperty(`${tInfo}[]`, item, itemSchema);
      return; // exit the forEach loop
    });
    // (2D) if we got here, we validated the array items so exit validator
    return;
  }

  // (3) tObj should be a valid object type, otherwise something messed up
  if (tobjType !== 'object') {
    const err = `* ${tInfo} : expected object, not ${tobjType}`;
    LOG(err);
    INVALID.push(err);
    return;
  }

  // (3A) it's a valid object, so remove any keys that start with '_' except for _schemaVersion
  const tobjKeys = Object.keys(tObj).filter(
    key => !key.startsWith('_') || key === '_schemaVersion'
  );

  // (3B) check keys of the object
  tobjKeys.forEach(key => {
    const checkProp = checkObj[key];
    const checkPath = tInfo ? `${tInfo}.${key}` : key;

    // (3C) see if the prop was found in the schema for this object
    if (checkProp === undefined) {
      // is this an old legacy property or runtime property that snuck into template data?
      const parentType = tInfo; // 'nodeDefs' or 'edgeDefs'
      if (EXTRAS20[parentType] && EXTRAS20[parentType].includes(key)) {
        const warn = `? ${tInfo}.${key} : non-schema property detected in dataset template (legacy?)`;
        if (DBG) LOG(warn);
        WARNINGS.push(warn);
        return;
      }

      // if not, then it's an unrecognized property that's not in the schema
      const err = `* ${tInfo}.${key} : extra property in template: not defined in schema`;
      if (DBG) LOG(err);
      EXTRA.push(err);
      return;
    }

    // (3D) this is unlikely, because key was derived from the tObj itself
    const objProp = tObj[key];
    if (objProp === undefined) {
      const err = `* ${tInfo}.${key} : required property: not found in dataset template`;
      if (DBG) LOG(err);
      MISSING.push(err);
      return;
    }
    // (3E) we have the key and the contents of the tObj[key], so check it against the schema
    const info = tInfo ? `${tInfo}.${key}` : key;
    r_ValidateProperty(info, objProp, checkProp);
    return;
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Recursively validate UI properties in the _ui metadata, pushing
 *  any issues to the respective arrays. This checks for control types
 *  and their required fields, as well as nested composite controls. */
function m_ValidateUIProperties(uiObj, tInfo = '_ui') {
  // walk all the top-level keys of _ui
  for (const [key, uiDef] of Object.entries(uiObj)) {
    // skip internal keys
    if (key.startsWith('_')) continue;
    const pkey = tInfo ? `${tInfo}.${key}` : key;
    // check if this key is actually in the schema
    if (!TEMPLATE_SCHEMA[key]) {
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
    if (!CONTROL_SCHEMA[uiDef.control]) {
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
    const controlProps = CONTROL_SCHEMA[uiDef.control];
    // these are the UI form elements, not the data itself
    // a general idea is that if the controlProp property names
    // end with 'key', they are a reference to something in the
    // template, not the UI metadata itself.
    const keys = Object.keys(controlProps);
    for (const prop of keys) {
      if (prop.endsWith('key')) {
        // see if it exists in template schema
        const propName = prop.slice(0, -3); // remove 'key'
        if (!TEMPLATE_SCHEMA[key][propName]) {
          if (DBG) LOG(`* ui ${key} : ${prop} does not exist in template schema`);
          INVALID.push(
            `${tInfo}${key}.${prop} : missing property '${propName}' in template schema`
          );
          continue;
        }
        if (DBG) LOG('. ui valid key prop', `${tInfo}${key}.${prop}`);
        if (tInfo.includes('[]')) {
          LOG(`> array ${tInfo} is valid`);
        } else VALID.push(`${tInfo}${key}.${prop}`);
        continue;
      }
      // if got here, prop doesn't end with 'key' so check ui data
      if (uiDef[prop] === undefined) {
        if (DBG) LOG(`* ui missing property in _ui.${key} : ${prop}`);
        MISSING.push(`${tInfo}${key}.${prop} : missing property in _ui.${key}`);
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
            `${tInfo}${key}.${prop} : checkObj ${expectedType}, got ${actualType}`
          );
        } else {
          if (DBG) LOG('* ui valid array', `${tInfo}${key}.${prop}`);
          VALID.push(`${tInfo}${key}.${prop}`);
        }
        continue;
      }
      // if got here, expectedType is a simple type
      if (actualType !== expectedType) {
        if (DBG) LOG(`* ui checkObj ${expectedType} in _ui.${key}.${prop}`);
        INVALID.push(
          `${tInfo}${key}.${prop} : checkObj ${expectedType}, got ${actualType}`
        );
        continue;
      }
      // if got here, it's a valid simple property
      if (DBG) LOG('. ui valid simple prop', `${tInfo}${key}.${prop}`);
      VALID.push(`${tInfo}${key}.${prop}`);
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Helper to find missing keys in the template object against the schema.
 *  It gathers all keys in the template and schema, then compares them.
 *  It prints the found keys side-by-side for easy comparison. */
function m_FindMissingKeys(template) {
  const templateKeys = new Map();
  const schemaKeys = new Map();
  r_GatherTemplateKeys(template, templateKeys);
  r_GatherSchemaKeys(TEMPLATE_SCHEMA, schemaKeys);
  for (const [schemaPath, schemaType] of schemaKeys) {
    if (!templateKeys.has(schemaPath)) {
      const err = `* ${schemaPath} : missing property (type: ${schemaType})`;
      MISSING.push(err);
    }
  }

  if (DBG) {
    // print the foundKeys side-by-side, using 80 column wide screen as reference
    // each column is 40 characters wide, and truncate the key length if longer then 38 chars
    const maxKeyLength = 38;
    const maxColWidth = 40;
    const col1 = foundTemplateKeys.map(key =>
      key.padEnd(maxColWidth).slice(0, maxColWidth)
    );
    const col2 = foundSchemaKeys.map(key =>
      key.padEnd(maxColWidth).slice(0, maxColWidth)
    );
    const col1Str = col1.join('\n');
    const col2Str = col2.join('\n');
    const col1Lines = col1Str.split('\n');
    const col2Lines = col2Str.split('\n');
    const maxLines = Math.max(col1Lines.length, col2Lines.length);
    const col1Padded = col1Lines.map(line => line.padEnd(maxColWidth + 1)); // +1 for the space between columns
    const col2Padded = col2Lines.map(line => line.padEnd(maxColWidth + 1)); // +1 for the space between columns
    // print the keys side-by-side
    LOG(`${PR}* SCHEMA KEYS vs FOUND TEMPLATE KEYS`);
    for (let i = 0; i < maxLines; i++) {
      const line1 = col1Padded[i] || ''.padEnd(maxColWidth + 1);
      const line2 = col2Padded[i] || ''.padEnd(maxColWidth + 1);
      LOG(`${line2}${line1}`);
    }
  }
}

/// MAIN API METHODS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Validate the TOML template structure against the schema. Return
 *  an object with arrays of valid, invalid, extra, and missing keys. */
function Validate(template) {
  // reset global validation arrays
  VALID = [];
  INVALID = [];
  EXTRA = [];
  WARNINGS = [];
  MISSING = [];

  // (1) Validate key types and structure
  r_ValidateProperty('', template, TEMPLATE_SCHEMA);

  // (2) Gather all keys in the template object
  m_FindMissingKeys(template, TEMPLATE_SCHEMA);

  // NEXT: Validate _ui metadata structure
  // if (template._ui) {
  //   m_ValidateUIProperties(template._ui, '');
  // } else {
  //   MISSING.push('_ui : missing UI metadata');
  //   console.log(`${CRT}* missing _ui metadata in template${NRM}`);
  // }
  const templateOK =
    INVALID.length === 0 && EXTRA.length === 0 && MISSING.length === 0;
  return { VALID, INVALID, EXTRA, MISSING, WARNINGS, templateOK };
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Return a report of validation results { templateOK, report } This is
 *  useful for logging or displaying in the UI. */
function ValidateTemplateObject(template) {
  if (typeof template !== 'object' || template === null) {
    console.log(PR, 'ValidateTemplateObject called with invalid template:', template);
    return [false, 'Invalid template object'];
  }
  Validate(template);
  let report = '';
  if (VALID.length > 0) {
    report += `### VALID TEMPLATE KEYS ###\n`;
    report += `    ${VALID.length} required keys found\n`;
  }

  const templateOK =
    INVALID.length === 0 && EXTRA.length === 0 && MISSING.length === 0;

  return [
    templateOK,
    report,
    {
      valid: VALID,
      invalid: INVALID,
      extra: EXTRA,
      missing: MISSING,
      warnings: WARNINGS,
      varies: VARIES
    }
  ];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Validate a TOML template file at the given tInfo. Returns [templateOK,
 *  report] where templateOK is a boolean and report is a string with validation
 *  results. */
function ValidateTOMLTemplate(templatePath) {
  let template;
  try {
    const content = FSE.readFileSync(templatePath, 'utf8');
    template = TOML.parse(content);
  } catch (err) {
    console.error(`Error reading or parsing template at ${templatePath}:`, err);
    return [false, `Error reading template: ${err.message}`];
  }
  return ValidateTemplateObject(template);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  Validate, // templateObj => { VALID, INVALID, EXTRA, MISSING, WARNINGS, templateOK }
  ValidateTOMLTemplate, // templatePath => [templateOK, report, logObject]
  ValidateTemplateObject // templateObj => [templateOK, report, logObject]
};
