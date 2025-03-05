/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / CROSS-PLATFORM COMMON EXPORTS

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
