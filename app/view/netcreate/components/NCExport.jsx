/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## Export

  Any user can export data.

  ## USAGE

    <NCExport />

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');

const IMPORTEXPORT = require('../importexport-mgr');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCExport';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCImportExport extends UNISYS.Component {
  constructor(props) {
    super(props);
    this.onNodesExportSelect = this.onNodesExportSelect.bind(this);
    this.onEdgesExportSelect = this.onEdgesExportSelect.bind(this);
  } // constructor

  componentDidMount() {}

  componentWillUnmount() {}

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  onNodesExportSelect() {
    IMPORTEXPORT.ExportNodes();
  }
  onEdgesExportSelect() {
    IMPORTEXPORT.ExportEdges();
  }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const exportjsx = (
      <div className="panel">
        <h1>Export Data</h1>
        <p className="system">Export data in .csv format.</p>
        <div className="buttonbar">
          <button className="small" type="button" onClick={this.onNodesExportSelect}>
            Export Nodes
          </button>
          <button className="small" type="button" onClick={this.onEdgesExportSelect}>
            Export Edges
          </button>
        </div>
      </div>
    );

    return <div className="NCImportExport">{exportjsx}</div>;
  }
} // class Help

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCImportExport;
