/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import YAML from 'yaml';
import * as TEXT from '../../../../common/util-text.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj as StateObj } from '../../../../_types/ursys.d.ts';

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ParseText(metaText: string): StateObj {
  const meta = YAML.parse(metaText);
  if (typeof meta !== 'object' || meta === null) {
    throw new Error('Invalid metadata format');
  }
  return meta as StateObj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AssertGroupName(name: string): string {
  if (!TEXT.IsAtomicKeyword(name)) throw Error(`Invalid group name: ${name}`);
  return name;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ParseText, AssertGroupName };
