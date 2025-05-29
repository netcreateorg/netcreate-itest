/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Group of Filters for Nodes or Edges

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import FILTER from './FilterEnums';
import NCNumberFilter from './NCNumberFilter';
import NCStringFilter from './NCStringFilter';
import NCSelectFilter from './NCSelectFilter';
import NCHDateFilter from './NCHDateFilter';
import NCFilterGroupProperties from './NCFilterGroupProperties';

/// METHODS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCFilterGroup({ group, label, filters, filterAction, transparency }) {
  return (
    <div className="filter-group">
      <h1>{label}</h1>
      {filters.map(filter => {
        switch (filter.type) {
          case FILTER.TYPES.MARKDOWN:
          case FILTER.TYPES.NODE:
          case FILTER.TYPES.DATE: // generic dates (not hdate) are treated like strings
          case FILTER.TYPES.INFOORIGIN:
          case FILTER.TYPES.STRING:
            return (
              <NCStringFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          case FILTER.TYPES.NUMBER:
            return (
              <NCNumberFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          case FILTER.TYPES.SELECT:
            return (
              <NCSelectFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          case FILTER.TYPES.TIMESTAMP: // UI uses HDate to set date, but parser uses custom timestamp
          case FILTER.TYPES.HDATE:
            return (
              <NCHDateFilter
                key={filter.id}
                group={group}
                filter={filter}
                filterAction={filterAction}
              />
            );
          default:
            console.error(
              `FilterGroup: Filter Type not found ${filter.type} for filter`,
              filter
            );
            break;
        }
        return '';
      })}
      <NCFilterGroupProperties group={group} transparency={transparency} />
      <hr />
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCFilterGroup;
