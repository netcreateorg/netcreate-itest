/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / CROSS-PLATFORM COMMON EXPORTS
  derived from: _ur/core/common/@common.ts

  A currated set of user-facing exports. The commented-out modules are ones
  that are generally used for internal operations.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import StateMgr from './class-state-mgr.ts';

/// CLASS EXPORTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { StateMgr }; // used by NetCreate.jsx

/// UTILITY EXPORTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** named: TERM, CSS, ANSI, ConsoleStyler, TerminalLog */
export * as PROMPTS from './util-prompts.ts';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** named: BadString, ThrowBadString, IsAlphaNumeric, HasSingleDash,
 *         HasNoSpaces
 *  -      IsSnakeCase, IsCamelCase, IsKebabCase, IsPascalCase,
 *         IsUpperSnakeCase, IsValidCustomTag, IsAtomicKeyword,
 *  -      AssetNumber, AssertString, AssertAlphanumeric,
 *         AssertKeyword, ForceAlphanumeric, MakeLowerSnakeCase,
 *  -      PreprocessDataText, MakeUpperSnakeCase, MakeKebabCase,
 *         MakePascalCase, MakeCamelCase */
// export * as TEXT from './util-text.ts';

/// DATA OPERATIONS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** named: NormEntID, NormItem, NormItemList, NormItemDict, NormIDs,
 *         NormStringToValue, DeepClone, DeepCloneObject, DeepCloneArray */
// export * as NORM from './util-data-norm.ts';
