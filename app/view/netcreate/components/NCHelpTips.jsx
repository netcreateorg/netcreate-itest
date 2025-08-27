/* eslint-disable react/no-unescaped-entities */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Tips is some basic advice for how to look around the network, intended for
    teachers to suggest kids look here and try the steps if they forget

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React from 'react';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCTips() {
  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div id="NCTips">
      This is a placeholder...
      <br></br> <br></br>
      <details>
        <summary>Check the source!</summary>
        <p>
          Look at the network citation for some background, and the provenance of
          different nodes and edges. Does it seem biased? Other things?
        </p>
      </details>
      <details>
        <summary>Look for large nodes</summary>
        <p>They indicate important entites that likely impact many other elements</p>
      </details>
      <details>
        <summary>Try moving nodes around</summary>
        <p>
          This can help make the importance of different connections visible ...
          <details>
            <summary>Does a lot move? </summary>
            <p>This node might have a big influence!</p>
          </details>
          <details>
            <summary>Very little moves? </summary>
            <p>
              Maybe there are other big nodes with a lot of influence? Let's look.
            </p>
          </details>
        </p>
      </details>
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCTips;
