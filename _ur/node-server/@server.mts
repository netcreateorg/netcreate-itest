/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  entrypoint for server

  when making live changes, make sure that the ur builder is also running and
  users of this library are watching for changes to the ur library

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/* added for pull request #81 so 'npm run lint' test appears clean */
/* eslint-disable no-unused-vars */

import UrModule from './class-urmodule.mts';
import * as MODMGR from './urmod-mgr.mts';
import * as APPSERV from './appserver.mts';
import * as ENV from './env-node.mts';
import * as FILES from './files.mts';
// cjs-style modules
import PROMPTS from '../common/prompts.js';
const { makeTerminalOut } = PROMPTS;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// RUNTIME API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** first time initialization */
function Initialize(options: UR_InitOptions): void {
  const { rootDir } = options;
  ENV.SetRootPaths(rootDir);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { makeStyleFormatter } = PROMPTS;
export {
  // URSYS CONTROL
  Initialize,
  // MAIN MODULES
  APPSERV, // application server
  MODMGR, // ur module manager
  ENV, // environment utilities and constants
  FILES, // file utilities
  // CLASSES
  UrModule, // ur module wrapper
  // COMMON UTILS
  makeTerminalOut as TerminalFormatter // prompt style formatter
};