/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NODE SERVER API
  derived from: _ur/core/node-server/@node-index.mts

  A currated set of server-related exports used to build the minimum
  URSYS (MUR) for use with NetCreate

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as NC from './nc-interop.mts';

/// PACKAGED EXPORTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** named: FileExists, DirExists, IsDir, IsFile,
 *         EnsureDir, EnsureDirChecked, RemoveDir,
 * -       GetRootDirts, DetectedRootDir, DetectedAddonDir,
 *         FindParentDir, AbsLocalPath, RelLocalPath, TrimPath,
 *         GetPathInfo, AsyncFileHash,
 * -       GetDirContent, Files, FilesHashInfo, Subdirs
 * -       ReadFile, AsyncReadFile, UnsafeWriteFile, ReadJSON,
 *         WriteJSON, AsyncReadJSON, AsyncWriteJSON,
 * -       UnlinkFile */
export * as FILE from './file.mts';
/** named: ComposeSettingsObj */

/// INTEROP MODULES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export * as NC from './nc-interop.mts';
export * as SettingMgr from './mur-setting-mgr.mts';

/// FORWARDED COMMON EXPORTS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export * from '../common/@common.ts';
export { TerminalLog } from '../common/util-prompts.ts';
