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

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { EDITORTYPE } = require('system/util/enum');
const TEMPLATE_MGR = require('../template-editor-mgr');
const LOCKMGR = require('../lock-mgr');
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
    this.urstate_LOCKSTATE = this.urstate_LOCKSTATE.bind(this);
    this.onTOMLfileSelect = this.onTOMLfileSelect.bind(this);
    this.onDownloadTemplate = this.onDownloadTemplate.bind(this);
    this.onSaveChanges = this.onSaveChanges.bind(this);

    this.OnAppStateChange('LOCKSTATE', this.urstate_LOCKSTATE);
  } // constructor

  componentDidMount() {
    const LOCKSTATE = this.AppState('LOCKSTATE');
    this.urstate_LOCKSTATE(LOCKSTATE);
    DATASTORE.GetTemplateTOMLFileName().then(result => {
      this.setState({ tomlfilename: result.filename });
    });
  }

  componentWillUnmount() {
    this.AppStateChangeOff('LOCKSTATE', this.urstate_LOCKSTATE);
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  urstate_LOCKSTATE(LOCKSTATE) {
    // someone else might be editing a template or importing or editing node or edge
  }

  /// METHODS /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  }

  onTOMLfileSelect(e) {
    // import
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
    const {
      tomlfileStatus,
      tomlfileErrors,
      tomlfilename
    } = this.state;
    let mgrJSX;

      // Node or Edge is being edited, show disabled message
      mgrJSX = (
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
      mgrJSX = (
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
        <h4>Template Editor</h4>
        <p>
          <label>Current Template File Name:</label> <code>{tomlfilename}</code>
        </p>
        <hr />
        {mgrJSX}
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCTemplate;
