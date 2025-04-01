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

/// STRING CHECKERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  IsValue,
  IsObject,
  IsArray,
  //
  HasSingularKey
};
