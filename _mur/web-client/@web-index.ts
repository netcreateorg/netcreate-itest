/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / WEB CLIENT
  derived from: _ur/core/web-client/@web-index.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ben's comment manager
export * as COMMENT from './comment/ac-comment.ts';
/// sri's web components
export * as VIEWLIB from './viewlib/index.ts';
/// interop with NetCreate
export * as NCI from './nc-client-interop.ts';

/// FORWARDED COMMON EXPORTS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export * from '../common/@common.ts';
export { ConsoleStyler } from '../common/util-prompts.ts';

/// FORWARDED TYPE EXPORTS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type { DataObj, ErrObj, StatusObj, OpResult } from '../_types/ursys.d.ts';
