/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Text and String Processing Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BadString(str: string) {
  if (typeof str !== 'string') return true;
  if (str.length === 0) return true;
  if (str.trim().length === 0) return true;
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ThrowBadString(str: string) {
  if (BadString(str)) throw Error(`${str} is not a string`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns a number if the input is a number or a string that can be parsed
 *  to a number. Otherwise, it throws an error. */
function AssertNumber(num: number | string): number {
  if (typeof num === 'number') return num;
  if (typeof num === 'string') {
    const parsed = parseFloat(num);
    if (!isNaN(parsed)) return parsed;
  }
  throw Error(`Expected number, got ${num}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AssertString(str: string): string {
  if (BadString(str)) throw Error('AssertString: not a string');
  return str;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a keyword is a string with no spaces and is alphanumeric. */
function AssertKeyword(str: string): string {
  if (!IsAtomicKeyword(str)) throw Error('AssertKeyword: not a keyword');
  return str;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AssertAlphanumeric(str: string): string {
  if (BadString(str)) throw Error('AssertAlphanumeric: not a string');
  if (IsAlphaNumeric(str)) return str;
  throw Error(`AssertAlphanumeric: ${str} is not alphanumeric`);
}

/// PARSER INPUT NORMALIZER ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Format a multi-line string to make parsing operations easier. It
 *  conforms newlines, replaces tabs. It removes whitespace around
 *  delimiters and collapses quoted whitespace to a single space.
 *  Finally, it ensures that there is a trailing newline.
 */
function PreprocessDataText(str: string): string {
  if (BadString(str)) throw Error('PreprocessDataText: not a string');
  let normalizedStr = str.replace(/\r\n|\r/g, '\n'); // conform newlines
  normalizedStr = normalizedStr // remove trailing/preserve leading whitespace
    .split('\n')
    .map(line => line.replace(/\s+$/, '')) // remove trailing
    .map(line => line.replace(/^\s+/, '')) // remove leading
    .join('\n');
  normalizedStr = normalizedStr.replace(/\t/g, '  '); // replace tabs with 2 spaces
  let lines = normalizedStr.split('\n'); // split string into lines
  /** process whitespace around delimiters */
  const processDelimited = (line, delimiter) => {
    let parts = line.split(delimiter); // split lines based on delimiter
    for (let i = 0; i < parts.length; i++) {
      parts[i] = parts[i].trim();
      parts[i] = parts[i].replace(/\s+/g, ' ');
    }
    return parts.join(delimiter);
  };
  for (let i = 0; i < lines.length; i++) {
    lines[i] = processDelimited(lines[i], ',');
    lines[i] = processDelimited(lines[i], ':');
  }
  normalizedStr = lines.join('\n').trim();
  return normalizedStr + '\n';
}

/// CHECKS ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsAlphaNumeric(str: string) {
  ThrowBadString(str);
  const alphaNumeric = /^[a-zA-Z0-9\s]+$/.test(str);
  const singleSpaces = !/\s{2,}/.test(str);
  const trimmed = str.trim() === str;
  const noLeadNum = !/^[0-9]/.test(str);
  return alphaNumeric && singleSpaces && noLeadNum && trimmed;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasNoSpaces(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  return noSpaces;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasSingleDash(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  const singleDash = str.split('-').length - 1 === 1;
  return noSpaces && singleDash;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsSnakeCase(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  const snakeCase = /^[a-z_]+$/.test(str);
  return noSpaces && snakeCase;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsCamelCase(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  const camelCase = /^[a-z]+[A-Z][a-z]*$/.test(str);
  return noSpaces && camelCase;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsPascalCase(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  const pascalCase = /^[A-Z][a-z]*$/.test(str);
  return noSpaces && pascalCase;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsKebabCase(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  const kebabCase = /^[a-z]+(-[a-z]+)*$/.test(str);
  return noSpaces && kebabCase;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsUpperSnakeCase(str: string) {
  ThrowBadString(str);
  const noSpaces = !/\s/.test(str);
  const upperSnakeCase = /^[A-Z_]+$/.test(str);
  return noSpaces && upperSnakeCase;
}

/// SPECIALIZED CHECKS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** web components must be lower case with one and only one dash */
function IsValidCustomTag(tagName: string) {
  ThrowBadString(tagName);
  const noSpaces = !/\s/.test(tagName);
  const oneDash = tagName.split('-').length - 1 === 1;
  const lowerCase = tagName === tagName.toLowerCase();
  return noSpaces && oneDash && lowerCase;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** alphanumeric, no spaces, no leading numbers, and no special characters,
 *  lowercase */
function IsAtomicKeyword(str: string) {
  ThrowBadString(str);
  const noSpaces = HasNoSpaces(str);
  const isAN = IsAlphaNumeric(str);
  const noLeadNum = !/^[0-9]/.test(str);
  const noSpecial = !/[^a-zA-Z0-9]/.test(str);
  const isLower = str === str.toLowerCase();
  return noSpaces && isAN && noLeadNum && noSpecial && isLower;
}

/// CONFORMING UTILITIES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** convert all non-alphanumeric characters to a space, and replace multiple
 *  spaces with a single space */
function ForceAlphanumeric(str: string, delimiter: string = ' ') {
  ThrowBadString(str);
  const alphaNumeric = str.trim().replace(/[^a-zA-Z0-9\s]/g, ' ');
  return alphaNumeric.replace(/\s+/g, delimiter);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeLowerSnakeCase(str: string) {
  return ForceAlphanumeric(str, '_').toLowerCase();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeUpperSnakeCase(str: string) {
  return ForceAlphanumeric(str, '_').toUpperCase();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeKebabCase(str: string) {
  return ForceAlphanumeric(str, '-').toLowerCase();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakePascalCase(str: string) {
  const alphaNumeric = ForceAlphanumeric(str, ' ');
  const parts = alphaNumeric.split(' ');
  const capitalized = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
  return capitalized.join('');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeCamelCase(str: string) {
  const alphaNumeric = ForceAlphanumeric(str, ' ');
  const parts = alphaNumeric.split(' ');
  const capitalized = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
  capitalized[0] = capitalized[0].toLowerCase(); // lower case first part
  return capitalized.join('');
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // BASE CHECKS
  BadString, // 0-length and empty strings also fail
  ThrowBadString, // throw error if bad/empty string
  IsAlphaNumeric, // alphanumeric with single spaces, trimmed
  HasSingleDash, // true if one and only one dash
  HasNoSpaces, // true if no spaces
  // FANCY CHECKS
  IsSnakeCase,
  IsCamelCase,
  IsPascalCase,
  IsKebabCase,
  IsUpperSnakeCase,
  IsValidCustomTag, // check is lower case with one dash
  IsAtomicKeyword, // true if alphanumeric with no spaces, lowercase
  // PROCESSING UTILITIES
  AssertNumber, // return number|parsed number or throw Error
  AssertString, // return string or throw Error
  AssertAlphanumeric, // return alphanumeric string or throw Error
  AssertKeyword, // return single alphanum word or throw Error
  ForceAlphanumeric, // non-alphanumeric chars -> delimiter
  MakeLowerSnakeCase, // conformers uses ForceAlphanumeric as base
  // FANCY PROCESSING
  PreprocessDataText, // normalize text for parsing
  MakeUpperSnakeCase,
  MakeKebabCase,
  MakePascalCase,
  MakeCamelCase
};
