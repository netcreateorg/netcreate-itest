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
        <summary>Look for large nodes</summary>
        <p>They indicate important entites that likely impact many other elements</p>
      </details>
      <details>
        <summary>Try moving nodes around</summary>
        <p>
          This can help make the importance of different connections visible ...
          <details>
            <summary>Nested thing ... </summary>
            <p>
              This can help make the importance of different connections visible ...
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
