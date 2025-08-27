/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  nc-utils

  General purpose utilities for manipulating NCDATA.
  Used by:
  * nc-logic
  * filter-mgr

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API METHOD
 *  Generates a universal unique identifer for use with
 *  - comment ids
 *  This is a placeholder method.
 *  @return string
 */
function GenerateUUID() {
  // TODO generate actual unique id
  return String(Math.random() * 128);
}
/** API METHOD
 *  Calculates and sets `degrees` for all nodes
 *  `degrees` is the number of edges connected to a node
 *  degrees needs to be recalculated whenever an edge is changed
 *  This modifies `data`
 *  @param {object} data
 *  @param {array} data.nodes
 *  @param {array} data.edges
 */
function RecalculateAllNodeDegrees(data) {
  const degrees = new Map();
  function inc(nodeId) {
    const val = degrees.get(nodeId) || 0;
    degrees.set(nodeId, val + 1);
  }
  // Count edges efficiently
  data.edges.forEach(e => {
    inc(e.source);
    inc(e.target);
  });
  // Apply the sums
  data.nodes.forEach(n => {
    n.degrees = degrees.get(n.id) || 0;
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API METHOD
 *  Calculates and sets `size` for all edges
 *  `size` is the sum of all edge weights that have the same source/targets
 *  By default `weight` is 1.
 *  @param {object} data
 *  @param {array} data.nodes
 *  @param {array} data.edges
 */
function RecalculateAllEdgeSizes(data) {
  const size = new Map();
  function getKey(sourceId, targetId) {
    // key always starts with the smaller value
    return sourceId < targetId
      ? `${sourceId}-${targetId}`
      : `${targetId}-${sourceId}`;
  }
  function inc(weight, sourceId, targetId) {
    const w = weight || 1;
    const key = getKey(sourceId, targetId);
    const val = size.get(key) || 0;
    size.set(key, val + w);
  }
  // Count edges efficiently
  data.edges.forEach(e => {
    inc(e.weight, e.source, e.target);
  });
  // Apply the sums
  data.edges.forEach(e => {
    const key = getKey(e.source, e.target);
    e.size = size.get(key) || 1;
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API METHOD
 *  Generates the "InfoOrigin" string:
 *     "Created by <createdBy> on <creeated>"
 *  @param {string} author
 *  @param {date} ms
 */
function DeriveInfoOriginString(author, ms) {
  return `Created by ${author} on ${new Date(ms).toLocaleString()}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API METHOD
 * Converts a hex color to an rgba string.
 * @param {string} hex - The hex color string (e.g., "#ff0000").
 * @param {number} [alpha=1] - The alpha value for the rgba color (default is 1).
 * @returns {string} The rgba color string (e.g., "rgba(255, 0, 0, 1)").
 * @example
 * const rgbaColor = hex2rgba("#ff0000", 0.5); // "rgba(255, 0, 0, 0.5)"
 * const rgbaColor = hex2rgba("#00ff00"); // "rgba(0, 255, 0, 1)"
 * const rgbaColor = hex2rgba("#0000ff", 0.8); // "rgba(0, 0, 255, 0.8)"
 */
function hex2rgba(hex, alpha = 1) {
  // Remove the hash if present
  hex = hex.replace('#', '');

  // Handle 3-digit hex colors by expanding them to 6-digit
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('');
  }

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API METHOD
 *  Removes diacritic marks for comparison purposes
 *  @param {string} stringToProcess
 */
function RemoveDiacriticMarks(stringToProcess) {
  return stringToProcess.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/// MODULE EXPORTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GenerateUUID,
  RecalculateAllNodeDegrees,
  RecalculateAllEdgeSizes,
  DeriveInfoOriginString,
  hex2rgba,
  RemoveDiacriticMarks
};
