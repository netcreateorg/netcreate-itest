/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Template Manager

  Client-side

  This is a work in progress module that will handle all template management.
  Eventually `template-editor-mgr` will probably be folded into this module.


  ## NOTES

  * Node/Edge Data is retained
    The template definitions can be used essentially to show/hide particular fields.
    This allows users to switch from one template to another without losing data.


  ## BACKGROUND

  Template data is loaded by `server-database` DB.InitializeDataset call.

  With Version 1.4 of Net.Create, we introduce a new TOML template format that
  is easier to work with directly.
  * If you open a project that does not have a TOML template, the app will
    try to load the old JSON version and convert it.  See
    server-database.m_LoadJSONTemplate() and m_MigrateJSONtoTOML().
  * If you try to load a TOML template that is missing some key fields
    (e.g. error message definitions), then the app will fall back on
    fields defined in the schema.  See server-database.async_LoadTOMLTemplate()).

  With Version 2.0 of Net.Create, we want to centralize all of the template
  management logic in this module.

  Used by:
  * nc-ui

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API METHOD
 *  Returns an array of attribute keys defined in the template definitions
 *  Attributes are:
 *  - Not built-in fields
 *  - Not provenance fields
 *  - Not hidden fields
 *  ...in other words, every other field that has been defined in the template.
 */
function GetAttributeDefKeys(defs, BUILTIN_FIELDS) {
  return Object.keys(defs).filter(
    k => !BUILTIN_FIELDS.includes(k) && !defs[k].isProvenance && !defs[k].hidden
  );
}
/** API METHOD
 *  Returns an array of provenance keys defined in the template definitions
 *  Provenance fields are:
 *  - Designated as `isProvenance` field
 *  - Not built-in fields
 *  - Not hidden fields
 */
function GetProvenanceDefKeys(defs, BUILTIN_FIELDS) {
  return Object.keys(defs).filter(
    k => defs[k].isProvenance && !BUILTIN_FIELDS.includes(k) && !defs[k].hidden
  );
}

/// MODULE EXPORTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GetAttributeDefKeys,
  GetProvenanceDefKeys
};
