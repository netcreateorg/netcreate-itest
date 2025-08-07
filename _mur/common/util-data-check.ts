/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Data Check and Validation Utility Module

  Utilities for checking types and formats of inputs

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type {
  UR_EntID,
  DataObj,
  UR_Item,
  UR_ItemDict,
  UR_ItemList
} from '../_types/dataset.ts';

/// TYPE CHECKERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extended typeof to handle arrays */
function ExTypeof(obj) {
  if (Array.isArray(obj)) {
    return `array`;
  }
  return typeof obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the object is a simple value type */
const value_types = ['string', 'number', 'boolean'];
function ExIsValue(obj) {
  const type = ExTypeof(obj);
  return value_types.includes(type);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return by value for simple types, or clone of object for complex types */
function ExValue(obj) {
  if (ExIsValue(obj)) return obj; // simple value type, return as-is
  if (Array.isArray(obj)) return [...obj]; // clone array
  if (typeof obj === 'object') return { ...obj }; // clone object
  throw Error(`ExValue: unsupported type ${ExTypeof(obj)}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsValue(val: any): boolean {
  return (
    typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean'
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsObject(obj: any): boolean {
  return typeof obj === 'object' && !Array.isArray(obj);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsArray(arr: any): boolean {
  return Array.isArray(arr);
}

/// OBJECT CHECKERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasSingularKey(obj: any): boolean {
  const isObj = IsObject(obj);
  return isObj && Object.keys(obj).length === 1;
}

/// TYPE CHECKERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Check if a value is numeric whether is a number or a numeric string */
function IsNumeric(value: any): boolean {
  return (
    (typeof value === 'number' && !isNaN(value) && isFinite(value)) ||
    (typeof value === 'string' && !isNaN(parseFloat(value)))
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Check if a value is an integer whether is a number or a numeric string */
function IsInteger(value: any): boolean {
  return (
    (typeof value === 'number' && Number.isInteger(value)) ||
    (typeof value === 'string' && !isNaN(parseInt(value)))
  );
}

/// STRING CHECKERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  ExTypeof,
  ExIsValue,
  //
  IsNumeric,
  IsInteger,
  IsValue,
  IsObject,
  IsArray,
  //
  HasSingularKey
};
