/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Data Settings Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as CHK from '../common/util-data-check.ts';
import { IsCamelCase } from '../common/util-text.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type ValueType = 'value' | 'array' | 'meta' | Array<'value' | 'array' | 'meta'>;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** optional yaml keys */
type SchemaMeta = {
  _schemaVersion?: string;
  _schemaLayer?: string; // defines a settings layer
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This defines the settings schema for a groups of properties */
type PropGroupStruct = {
  [groupID: string]: {
    [propID: string]: any;
  };
} & SchemaMeta;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** client value submissions submit either a value or array of values.
 *  These are decoded into a PropToken object on the server */
type PropSubmitValue = {
  [dotProp: string]: ValueType;
} & SchemaMeta;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** client metadata changes submit an object of metadata properties
 *  These are decoded into a PropToken object on the server */
type PropSubmitMeta = {
  [dotProp: string]: {
    [meta: string]: ValueType;
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** PropDefs are the baseline definition for a property with key propID */
type PropDef = {
  default?: any; /// default value
  type?: string; // type declared in TypeDefs
};
/** ValueDefs are the saved value of a property */
type ValueDef = {
  value?: ValueType;
};
/** MetaDefs are additional properties that augment a property def */
type MetaDef = {
  [key: string]: any; // camelCase keys
};
/** PropTokens are the decoded result of a PropSubmitValue or PropSubmitMeta
 *  sent to the server */
type PropToken = {
  groupID?: string; // camelCase
  propID?: string; // camelCase
  type?: string; // value | array | meta
  error?: string;
  [key: string]: any; // camelCase keys
} & PropDef &
  ValueDef &
  MetaDef &
  SchemaMeta;

/// DECODE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a dotProp is a string with a groupID and a propID separated by a period */
function DecodeDotProp(dotProp: string): PropToken {
  const [groupID, propID, ...extra] = dotProp.split('.');
  if (extra.length > 0) return { error: `invalid dotProp: ${dotProp}` };
  if (!IsCamelCase(groupID)) return { error: `invalid group name: ${groupID}` };
  if (!IsCamelCase(propID)) return { error: `invalid prop name: ${propID}` };
  return { groupID, propID };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a prop submit object is a single key object with a dotProp key and a value,
 *  where the value could values or an object of metadata properties */
function DecodePropObject(psObj: any): PropToken {
  if (!CHK.IsObject(psObj)) return { error: `expected object` };
  if (!CHK.HasSingularKey(psObj)) return { error: `bad obj structure` };
  const pKey = Object.keys(psObj)[0];
  const { groupID, propID, error } = DecodeDotProp(pKey);
  if (error) return { error };
  const pVal = psObj[pKey];
  if (!CHK.HasSingularKey(pVal)) return { error: `expected simple value` };
  const opID = { groupID, propID };
  if (CHK.IsValue(pVal)) return { ...opID, value: pVal, type: 'value' };
  if (CHK.IsArray(pVal)) return { ...opID, values: pVal, type: 'array' };
  if (CHK.IsObject(pVal)) return { ...opID, meta: pVal, type: 'meta' };
  return { error: `invalid value type ${pVal}` };
}

/// VALIDATION METHODS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** checks if the object is a valid prop submit object which is used for
 *  writing settings values to the server's settings manager */
function IsValueSubmitObj(psObj: PropSubmitValue): boolean {
  if (!CHK.IsObject(psObj)) return false;
  if (!CHK.HasSingularKey(psObj)) return false;
  const { error, type } = DecodePropObject(psObj);
  if (error) return false;
  return type !== 'value' && type !== 'array';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** check if the object is a valid prop meta submit, which sets the
 *  groupID, propID reference to a list of properties */
function IsMetaSubmitObj(msObj: PropSubmitMeta): boolean {
  if (!CHK.IsObject(msObj)) return false;
  if (!CHK.HasSingularKey(msObj)) return false;
  const { error, type } = DecodePropObject(msObj);
  if (error) return false;
  if (type !== 'meta') return false;
}

/// EXPORTS ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  //
  DecodeDotProp, // (dotProp: DotProp) => PropToken
  DecodePropObject, // (psObj: PropSubmitValue) => PropToken
  //
  IsValueSubmitObj, // (psObj: PropSubmitValue) => boolean
  IsMetaSubmitObj // (msObj: PropSubmitMeta) => boolean
};
export type { PropSubmitValue, PropToken };
