/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN CLI
  A Stripped-down version of URSYS

  designed to run inside of non-module nodejs legacy environment like
  NetCreate 2.0 ITEST (2023)

  It interfaces with other modules that are written in ESM and TYPESCRIPT,
  transpiled into CJS, and imported here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import esbuild from 'esbuild';
import { umdWrapper } from 'esbuild-plugin-umd-wrapper';
import FSE from 'fs-extra';

/// CONSTANTS AND DECLARATIONS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { ROOT, DIR_UR_DIST } from './env-build.mts';
import PROMPTS from '../common/util-prompts.ts';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const LOG = console.log.bind(console);
const { DIM, NRM } = PROMPTS.ANSI;

/// ESBUILD API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** build the UR libraries for server and client */
async function ESBuildLibrary() {
  // FSE.removeSync(DIR_UR_DIST); // don't do this because brunch watch will break
  FSE.ensureDir(DIR_UR_DIST);

  /** SERVER CLIENT SHARED BUILD SETTINGS **/
  const nodeBuild = {
    entryPoints: [`${ROOT}/_mur/node-server/@node-index.mts`],
    bundle: true,
    platform: 'node',
    target: ['node18', 'esnext'],
    logOverride: {
      'empty-import-meta': 'silent'
    },
    sourcemap: true,
    packages: 'external'
  };

  /* build the server library for nodejs */
  // @ts-ignore - build options
  await esbuild.build({
    ...nodeBuild,
    outfile: `${DIR_UR_DIST}/mur-node.mjs`,
    format: 'esm'
  });
  if (DBG) LOG('built ur-server ESM');

  // @ts-ignore - build options
  await esbuild.build({
    ...nodeBuild,
    outfile: `${DIR_UR_DIST}/mur-node.cjs`,
    format: 'cjs'
  });
  if (DBG) LOG('built ur-server CJS');

  /** BROWSER CLIENT SHARED BUILD SETTINGS **/
  const browserBuild = {
    entryPoints: [`${ROOT}/_mur/web-client/@web-index.ts`],
    bundle: true,
    platform: 'browser',
    target: ['es2018'], // brunch can't handle features beyond this date
    sourcemap: true
  };

  // @ts-ignore - build options
  await esbuild.build({
    ...browserBuild,
    outfile: `${DIR_UR_DIST}/mur-web-esm.js`,
    format: 'esm'
  });
  if (DBG) LOG('built ur-client ESM');

  // @ts-ignore - build options
  await esbuild.build({
    ...browserBuild,
    outfile: `${DIR_UR_DIST}/mur-web-cjs.js`,
    format: 'cjs'
  });
  if (DBG) LOG('built ur-web CJS');

  await esbuild.build({
    ...browserBuild,
    plugins: [umdWrapper()],
    outfile: `${DIR_UR_DIST}/mur-web-umd.js`,
    // @ts-ignore - esbuild-plugin-umd-wrapper option
    format: 'umd' // esbuild-plugin-umd-wrapper
  });
  if (DBG) LOG('built ur-client UMD');

  // if !DBG just emit a simpler message
  if (!DBG) console.log(`${DIM}info: built ursys-min (mur)${NRM}`);
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TEST **/
(async () => {
  await ESBuildLibrary();
})();
