/* eslint-disable no-alert */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NC Template Editor View
  (replaces `Template.jsx`)

  UI for importing and exprting templates.
  Template editting is done either:
  - via Settings panel
  - manually

  Templates can only be edited if:
  * There are no nodes or edges being edited
  * No one is trying to import data
  * There are no other templates being edited

  Conversely, if a Template is being edited, Import, Node and Edge editing
  will be disabled.

  ## BACKGROUND

    Template data is loaded by `server-database` DB.InitializeDataset call.

    templateIsBeingEditedByMe is used to by NCAdvancedPanel to coordinate the
    lock/unlock template editting across all the NCAdvancedPanel

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const TEMPLATE_MGR = require('../template-editor-mgr');
const DATASTORE = require('system/datastore');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCTemplate extends UNISYS.Component {
  constructor(props) {
    super(props);
    this.state = {
      tomlfile: undefined,
      tomlfileStatus: '',
      tomlfileErrors: undefined,
      tomlfilename: 'loading...'
    };
    this.onTOMLfileSelect = this.onTOMLfileSelect.bind(this);
    this.onDownloadTemplate = this.onDownloadTemplate.bind(this);
    this.onSaveChanges = this.onSaveChanges.bind(this);
  } // constructor

  componentDidMount() {
    // Display template filename
    DATASTORE.GetTemplateTOMLFileName().then(result => {
      this.setState({ tomlfilename: result.filename });
    });
  }

  componentWillUnmount() {}

  /// METHODS /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  onTOMLfileSelect(e) {
    // import template file
    const tomlfile = e.target.files[0];
    TEMPLATE_MGR.ValidateTOMLFile({ tomlfile }).then(result => {
      if (result.isValid) {
        console.log('got template', result.templateJSON);
        this.onSaveChanges(result.templateJSON);
      } else {
        const errorMsg = result.error;
        this.setState({
          tomlfile: undefined,
          tomlfileStatus: 'Invalid template file!!!',
          tomlfileErrors: errorMsg
        });
      }
    });
  }

  onDownloadTemplate() {
    TEMPLATE_MGR.DownloadTemplate();
  }

  onSaveChanges(templateJSON) {
    TEMPLATE_MGR.SaveTemplateToFile(templateJSON).then(result => {
      if (!result.OK) {
        alert(result.info);
      } else {
        alert(`Template Saved: ${templateJSON.name}`);
      }
    });
  }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    const { tomlfileStatus, tomlfileErrors, tomlfilename } = this.state;
    const { templateIsBeingEditedByMe } = this.props;
    let jsx;

    if (!templateIsBeingEditedByMe) {
      // Node or Edge is being edited, show disabled message
      jsx = (
        <div style={{ color: `var(--clr-warning)` }}>
          <p>
            <i>
              Templates cannot be edited while someone is editing a node, edge, or
              template, or importing data.
            </i>
          </p>
          <p>
            <i>Please finish editing and try again.</i>
          </p>
        </div>
      );
    } else {
      // OK to Edit, show Import/Download Buttons
      jsx = (
        <div>
          <p>ADVANCED USERS ONLY</p>
          <p></p>
          <i className="small text-muted">
            Import TOML template (replace existing template)
          </i>
          <br />
          <label>
            <input
              type="file"
              accept="text/toml"
              id="tomlfileInput"
              onChange={this.onTOMLfileSelect}
            />
            &nbsp;<i>{tomlfileStatus}</i>
            <br />
            {tomlfileErrors && <span style={{ color: 'red' }}>{tomlfileErrors}</span>}
          </label>
          <p></p>
          <i className="small text-muted">Download Current Template</i>
          <br />
          <button size="sm" onClick={this.onDownloadTemplate}>
            Download Current Template
          </button>
        </div>
      );
    }

    /// RENDER ///

    return (
      <div
        style={{
          backgroundColor: '#0003',
          padding: '10px 20px'
        }}
      >
        <h4>Template File Manager</h4>
        <p>
          <label>Current Template File Name:</label> <code>{tomlfilename}</code>
        </p>
        <hr />
        {jsx}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCTemplate;
