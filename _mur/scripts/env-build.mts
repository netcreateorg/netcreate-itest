/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / ENVIRONMENT DETECTION UTILITY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { join, normalize } from 'node:path';
import { statSync } from 'node:fs';
import { DetectedRootDir } from '../node-server/file.mts';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - -
const ROOT = DetectedRootDir();

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an absolute path string from root-relative path */
const u_path = (path = '') => {
  if (path.length === 0) return ROOT;
  path = normalize(join(ROOT, path));
  if (path.endsWith('/')) path = path.slice(0, -1);
  return path;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the path exists and is a directory */
const u_exists = dirpath => {
  try {
    const stat = statSync(dirpath);
    if (stat.isFile()) return false;
    return stat.isDirectory();
  } catch (err) {
    console.log('*** DirExists:', err.message);
    return false;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove ROOT prefix to return shortname */
const u_short = path => {
  if (path.startsWith(ROOT)) return path.slice(ROOT.length);
  return path;
};

/// RUNTIME CALCULATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NETCREATE ROOT OUTPUT
const DIR_APP = u_path('/app');
const DIR_PUBLIC = u_path('/public');
/// URSYS-MIN BUILD PATHS
const DIR_UR = u_path('/_mur');
const DIR_UR_DIST = u_path('/_mur/_dist');
const DIR_BDL_BROWSER = u_path('/_mur/browser-client');
const DIR_BDL_NODE = u_path('/_mur/node-server');

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  ROOT, // root of the project
  DIR_APP, // path of webapp source code
  DIR_PUBLIC, // path to PUBLIC directory for serving webapp
  DIR_UR, // path to _mur directory
  DIR_UR_DIST, // path to browser client code
  DIR_BDL_BROWSER, // path to node server code
  DIR_BDL_NODE, // path to _mur/dist directory for library out
  //
  u_exists as DirExists,
  u_path as MakePath,
  u_short as ShortPath
};
