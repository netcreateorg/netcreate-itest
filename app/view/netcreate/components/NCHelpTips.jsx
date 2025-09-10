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
      <h1>Not sure what to do next?</h1>
      <details>
        <summary><h2>Check the source!</h2></summary>
        <p>Click on a node or edge. Find the "Provenance" tab on the left-hand side of the screen. What do you notice?</p>
			<ul>
			<li>Who created this, and what might they have been focused on?</li>
			<li>How does this change how we think about this data?</li>
      </ul>
      </details>
      <details>
        <summary><h2>Look for large and small nodes</h2></summary>
        <ul>
        <li>Which nodes are the largest?</li>
        <li>Which are the smallest?</li>
        </ul>
        <p>Click on the large nodes and small nodes to see what makes them different.</p>
      </details>
      <details>
        <summary><h2>Try moving nodes around</h2></summary>
        <p>
          Click on a node and drag it around. (This can help make the importance of different connections visible.)</p>
          <details>
            <summary>Does a lot move? </summary>
            <p>This node might have a lot of influence on other nodes in this network</p>
          </details>
          <details>
            <summary>Does not much move?</summary>
            <p>
              Maybe there are other big nodes with a lot of influence "anchoring" the other nodes in the network in place against the influence of the node you're dragging.
            </p>
          </details>
      </details>
      <details>
        <summary><h2>Look at detailed data for the nodes/edges</h2></summary>
        Click on the Nodes or Edges tab at the top. These two tabs show all of the details for each node or edge in the network
			<ul>
			<li>Try sorting by node/edge type. What do you notice?</li>
			<li>Click the <svg width="22px" id="icon-view" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path id="eye" d="M30.30762,14.36768C28.25488,12.002,22.751,6.5,16,6.5S3.74512,12.002,1.69336,14.36572a2.49922,2.49922,0,0,0-.001,3.2666C3.74512,19.99805,9.249,25.5,16,25.5s12.25488-5.502,14.30762-7.86768A2.49888,2.49888,0,0,0,30.30762,14.36768ZM9.24042,20.25977A25.33965,25.33965,0,0,1,4.25391,16a25.33613,25.33613,0,0,1,4.98657-4.25977,7.93436,7.93436,0,0,0-.00006,8.51954ZM16,22a6,6,0,1,1,6-6A6.00657,6.00657,0,0,1,16,22Zm6.75952-1.74023a7.93436,7.93436,0,0,0,.00006-8.51954A25.33965,25.33965,0,0,1,27.74609,16,25.33613,25.33613,0,0,1,22.75952,20.25977ZM19,16a3.00014,3.00014,0,1,1-5.80646-1.03174,1.49952,1.49952,0,0,0,1.77472-1.77466A2.97577,2.97577,0,0,1,19,16Z"></path></svg> button to open the node/edge detail panel on the left. Find the "Provenance" tab and click it. Sort by the fields listed here. What do you notice?</li>
        </ul>
      </details>
      <details>
        <summary><h2>Limit what shows in the visualization</h2></summary>
        Try using the "Analysis" tab. Choose only one node or edge type to display, and then see what that changes about the network view.
      </details>
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCTips;
