/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SELECTFILTER

  SelectFilter provides the UI for setting drop-down menu selection
  style filters typically used for "type" node and edge properties.

  The menu options are defined with the extra `options` property
  of the filter.

  Two Select operators are supported (These just use the string operators on
  the values set via the menu selectios):
  * contains
  * not contains

  Matches will SHOW the resulting node or edge.
  Any nodes/edges not matching will be hidden.

  The filter definition is passed in via props.

    props
      {
        group       // "nodes" or "edges"
        filter: {
          id,       // numeric id used for unique React key
          type,     // filter type, e.g "string" vs "number"
          key,      // node field key from the template
          keylabel, // human friendly display name for the key.  This can be customized in the template.
          operator, // the comparison function, e.g. 'contains' or '>'
          value     // the search value to be used for matching
          options   // array of select option strings, e.g. ['abc','def',..]
        },
        filterAction // selected action
      }

  The `id` variable allows us to potentially support multiple search filters
  using the same key, e.g. we could have two 'Label' filters.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import FILTER from './FilterEnums';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCSelectFilter' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const OPERATORS = [
  FILTER.OPERATORS.NO_OP,
  FILTER.OPERATORS.CONTAINS,
  FILTER.OPERATORS.NOT_CONTAINS
];

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCSelectFilter({
  group,
  filter: { id, type, key, keylabel, operator, value, options },
  filterAction
}) {
  const [state, setState] = useState({
    operator: FILTER.OPERATORS.NO_OP.key, // Used locally to define result
    inputval: '', // Used to maintain input caret position
    value: 0 // Autoselect the first item
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    BroadcastChange();
  }, [state]);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeOperator(event) {
    setState(prevState => ({ ...prevState, operator: event.target.value }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeValue(event) {
    setState(prevState => ({ ...prevState, value: event.target.value }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function BroadcastChange() {
    const filterDef = {
      id,
      type,
      key,
      keylabel,
      operator: state.operator,
      value: state.operator === FILTER.OPERATORS.NO_OP.key ? '' : state.value,
      options
    };
    if (UDATA)
      UDATA.LocalCall('FILTER_DEFINE', {
        group,
        filter: filterDef,
        filterAction
      }); // set a SINGLE filter
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnSubmit(event) {
    // Prevent "ENTER" from triggering form submission!
    event.preventDefault();
    event.stopPropagation();
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <form className="filter-item" key={id} onSubmit={ui_OnSubmit}>
      <fieldset>
        <label className="help"> {keylabel} </label>
        <select
          type="select"
          value={operator}
          onChange={ui_OnChangeOperator}
          aria-label={`${keylabel} filter operator`}
        >
          {OPERATORS.map(op => (
            <option value={op.key} key={`${id}${op.key}`}>
              {op.label}
            </option>
          ))}
        </select>
        <select
          type="select"
          value={value}
          onChange={ui_OnChangeValue}
          disabled={operator === FILTER.OPERATORS.NO_OP.key}
        >
          {operator !== FILTER.OPERATORS.NO_OP.key
            ? options.map(op => (
                <option value={op} key={`${id}${op}`}>
                  {op}
                </option>
              ))
            : ''}
        </select>
      </fieldset>
    </form>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCSelectFilter;
