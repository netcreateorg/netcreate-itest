/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  encodings for specialized data types and triggers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a list of data encodings that can be used to describe data */
const ENCODING_TYPES = [
  // basic types
  'int', // an integer
  'float', // a floating-point value
  'string', // an arbitrary string
  'uint', // positive integers only
  'ufloat', // positive floats only
  'byte', // 8-bit byte (hex)
  'word', // 16-bit word (hex)
  'dword', // 32-bit word (hex)
  'qword', // 64-bit word (hex)
  // special types
  'axis', // a floating-point value between -1 and 1
  'vec2', // a 2D vector [x y]
  'vec3', // a 3D vector [x y z]
  'matrix3', // a 3D matrix (array of 9 floats)
  'matrix4', // a 4D matrix (array of 16 floats)
  'enum', // one of a particular set of symbols (string)
  'bits', // an array of bits (hex)
  'bits2', // a 2D array of bits [hex-row, ...]
  'fix2', // fixed-point 2 decimal places (string)
  'fix3', // fixed-point 3 decimal places (string)
  'dobj' // an object describing its shape using the above types
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a list of triggers that can be used to detect changes in a signal */
const TRIGGER_LOGIC = [
  'bistate', // a 0/1 continuous boolean signal
  'edge+', // a momentary transition from 0 to 1 (bool)
  'edge-', // a momentary transition from 1 to 0 (bool)
  'schmitt', // a hysteresis transition from 0 to 1 to 0 (bool)
  'schmitt+', // a hysteresis transition from 0 to 1 (bool)
  'schmitt-', // a hysteresis transition from 1 to 0 (bool)
  'pulse', // a momentary pulse of a specific duration (ms)
  'held+', // a continuous signal held for a specific duration (ms)
  'held-', // a continuous signal held for a specific duration (ms)
  'pcm' // a pulse code modulation signal (array of bits)
];

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ENCODING_TYPES, TRIGGER_LOGIC };
export type DataEncoding = (typeof ENCODING_TYPES)[number];
export type DataTrigger = (typeof TRIGGER_LOGIC)[number];
