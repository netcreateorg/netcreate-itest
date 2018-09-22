/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    ## OVERVIEW

    NodeSelector is a form for searching for, viewing, selecting, and editing
    Node information.

    NodeSelector does not modify any data.  It passes all events (text updates,
    highlights, and suggestion selections) up to nc-logic. it
    should process the events and update the data accordingly.  The
    updated data is then rendered by NodeSelect.

    ## USAGE

      <NodeSelector/>

    ## TECHNICAL DESCRIPTION

    NodeSelector handles three basic functions:

    1. Display the current SELECTION.nodes[0]
    2. Support input of node fields
    3. Send updated node field data to SOURCE_UPDATE

    As the user edits the form, we locally save the changes and send it to UNISYS
    when the user clicks "SAVE"

    The currently selected/editing node is set via SELECTION.nodes.

    Updates are sent to UNISYS via SOURCE_UPDATE.

    The AutoComplete search field is handled a little differently from the other
    input fields because it is independent of NodeSelector.  In order to keep
    NodeSelector's internal representation of form data up-to-date, we rely on
    the SELECTION updates' searchLabel field to update the label.

    ## STATES

      formData        Node data that is shown in the form

      isEditable      If true, form is enabled for editing
                      If false, form is readonly

    ## TESTING

    Edit Existing Node

      1. Type 'ah'
            * Nodes on graph should hilite
            * Suggestions should be displayed
            * "Add New Node" should be shown.
      2. Highlight 'Ah Sing'
            * Ah Sing node detail should be shown
      3. Unhighlight all selections (move mouse out)
            * NodeDetail should disappear
      4. Click 'Ah Sing'
            * 'Ah Sing's details should load in form
            * "Edit Node" button should be shown.
      5. Click "Edit Node"
            * "Save" should be shown
            * All fields should be enabled
      6. Edit 'Ah Sing' to 'Ah Sing A'
            * Form should not change
            * Hilited graph node should go away
      7. Edit fields (add text)
      8. Click "Save"
            * Form should clear
      9. Check 'Ah Sing' contents to make sure changes were saved

    Create New Node

      1. Type 'ah'
            * Nodes on graph should hilite
            * Suggestions should be displayed
            * "Add New Node" should be shown.
      2. Click 'Add New Node'
            * Fields should be enabled
            * A new ID should be added
            * "Save" button should appear
      3. Edit fields
      4. Click "Save"
            * New node should appear in graph
            * The node should have the label you added 'ah'
      5. Select the node to verify the contents

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR  = 'NodeSelector';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { Button, Col, Form, FormGroup, Label, Input, FormText } = ReactStrap;
const AutoComplete = require('./AutoComplete');
const NodeDetail   = require('./NodeDetail');
const EdgeEditor   = require('./EdgeEditor');

const UNISYS       = require('unisys/client');
const DATASTORE    = require('system/datastore');

const thisIdentifier = 'nodeSelector';   // SELECTION identifier

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NodeSelector extends UNISYS.Component {

    constructor (props) {
      super(props);
      this.state = {
        formData: {
            label:     '',
            type:      '',
            info:      '',
            notes:     '',
            id:        '',
            isNewNode: true
        },
        edges:         [],
        options: [
          {
            id:    "test",
            label: "Test",
            color: "#FF0000"
          }
        ],
        isEditable:    false,
        isValid:       false
      };
      // Bind functions to this component's object context
      this.clearForm                             = this.clearForm.bind(this);
      this.getNewNodeID                          = this.getNewNodeID.bind(this);
      this.handleSelection                       = this.handleSelection.bind(this);
      this.onStateChange_SEARCH                  = this.onStateChange_SEARCH.bind(this);
      this.loadFormFromNode                      = this.loadFormFromNode.bind(this);
      this.validateForm                          = this.validateForm.bind(this);
      this.onLabelChange                         = this.onLabelChange.bind(this);
      this.onTypeChange                          = this.onTypeChange.bind(this);
      this.onNotesChange                         = this.onNotesChange.bind(this);
      this.onInfoChange                          = this.onInfoChange.bind(this);
      this.onNewNodeButtonClick                  = this.onNewNodeButtonClick.bind(this);
      this.onEditButtonClick                     = this.onEditButtonClick.bind(this);
      this.onAddNewEdgeButtonClick               = this.onAddNewEdgeButtonClick.bind(this);
      this.onCancelButtonClick                   = this.onCancelButtonClick.bind(this);
      this.onSubmit                              = this.onSubmit.bind(this);

      // NOTE: assign UDATA handlers AFTER functions have been bind()'ed
      // otherwise they will lose context
      this.OnAppStateChange('SELECTION',(change) => {
        this.handleSelection(change);
      });
      this.OnAppStateChange('SEARCH', this.onStateChange_SEARCH);

      // Load Template
      let options = this.AppState('NODETYPES').options;
      // When we first render, the TEMPLATE may not be loaded yet.
      // If it's not loaded, define a dummy option for now
      if ( (options===undefined) || !Array.isArray(options) ) options = [];
      this.state.options = options;

      // Handle Template updates
      this.OnAppStateChange('NODETYPES',(data) => {
        this.setState({options: data.options});
      });


    } // constructor



/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Clear the form with optional label
/*/ clearForm ( label='' ) {
      this.setState({
        formData: {
            label,
            type:      '',
            info:      '',
            notes:     '',
            id:        '',
            isNewNode: true
        },
        edges: [],
        isEditable:      false,
        isValid:         false
      });
    } // clearFform
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return a new unique ID
    REVIEW: Should this be in nc-logic?
    ANSWER: YES. There shouldn't be ANY data-synthesis code in a component!
    HACK: Replace this code with a server call
/*/ getNewNodeID () {
      throw new Error("Don't use getNewNodeID() because it is not network safe");
      /*/
      let highestID = 0;
      let ids  = this.AppState('D3DATA').nodes.map( node => { return Number(node.id) } );
      if (ids.length>0) {
        highestID = ids.reduce( (a,b) => { return Math.max(a,b) } );
      }
      // REVIEW: Should ids be strings or numbers?
      // Right now most edge ids are strings
      return (highestID+1).toString();
      /*/
    } // getNewNodeID
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return a new unique ID
/*/ getNewEdgeID () {
      throw new Error("Don't use getNewEdgeID() because it is not network safe");
      /*/
      let highestID = 0;
      let ids  = this.AppState('D3DATA').edges.map( edge => { return Number(edge.id) } )
      if (ids.length>0) {
        highestID = ids.reduce( (a,b) => { return Math.max(a,b) } );
      }
      // REVIEW: Should ids be strings or numbers?
      // Right now most edge ids are strings
      return (highestID+1).toString();
      /*/
    } // getNewEdgeID
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle updated SELECTION
/*/ handleSelection ( data ) {
      if (DBG) console.log('NodeSelector: got state SELECTION',data);

      // Only update if we are the currently active field
      // otherwise an Edge might be active
      let { activeAutoCompleteId } = this.AppState('ACTIVEAUTOCOMPLETE');
      if ( (activeAutoCompleteId!==thisIdentifier) &&
           (activeAutoCompleteId!=='search')          ) return;

      if (!this.state.isEditable) {
        if (data.nodes && data.nodes.length>0) {

          // A node was selected, so load it
          // We're not editing, so it's OK to update the form
          if (DBG) console.log('NodeSelector: updating selection',data.nodes[0]);
          // grab the first node
          let node = data.nodes[0];
          this.loadFormFromNode( node );

          // Load edges
          let thisId = this.state.formData.id;
          // -- First, sort edges by source, then target
          data.edges.sort( (a,b) => {
            if (a.source.label === b.source.label) {
              // same source label, sort on target
              if (a.target.label < b.target.label) { return -1; }
              if (a.target.label > b.target.label) { return 1;  }
            }
            // Always list `this` node first
            if (a.source.id === thisId) { return -1; }
            if (b.source.id === thisId) { return 1;  }
            // Otherwise sort on source
            if (a.source.label < b.source.label) { return -1; }
            if (a.source.label > b.source.label) { return 1;  }
            return 0;
          });
          this.setState({
            edges: data.edges
          })
          // Exit now because we just selected a node and don't want to
          // override the form label with form updates.  Otherwise, the
          // the form label is overriden with old form data.
          return;
        } else {
          if (DBG) console.log('NodeSelector: No data.nodes, so clearing form');
          this.clearForm();
        }
      } else {
        // We're already editing, and another selection has come in.
        // What should we do?
        // * force exit?
        // * prevent load?
        // * prevent selection?
        if (DBG) console.log('NodeSelector: Already editing, ignoring SELECTION');
      }

      this.validateForm();

    } // handleSelection
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle updated SEARCH
    AutoComplete handles its internal updates, but we do need to validate the form
    When AutoComplete's input field is updated, it sends a SOURCE_SEARCH to ACL
    which returns the updated value in SEARCH state.  AutoComplete updates
    the input field using SEARCH.  We need to update the form data here
    and validate it for NodeSelector.
/*/ onStateChange_SEARCH ( data ) {
      // Only update if we are the currently active field
      // otherwise an Edge might be active
      let { activeAutoCompleteId } = this.AppState('ACTIVEAUTOCOMPLETE');
      if (
        (activeAutoCompleteId!==thisIdentifier) &&
        (activeAutoCompleteId!=='search')
      ) return;

      let formData = this.state.formData;
      formData.label = data.searchLabel;
      this.setState({
        formData
      });

      this.validateForm();
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Copy the node data passed via SELECTION in the form
/*/ loadFormFromNode ( newNode ) {
      if (DBG) console.log('NodeSelector.loadFormFromNode',newNode);
      if (newNode===undefined) {
        throw "NodeSelector.loadFormFromNode called with undefined newNode!";
      }
      // Clean data
      // REVIEW: Basic data structure probably needs updating
      let node = {attributes:{}};
      if (newNode.attributes===undefined) { newNode.attributes = {} }
      //
      node.label                    = newNode.label || '';
      node.id                       = newNode.id    || '';
      node.attributes["Node_Type"]  = newNode.attributes["Node_Type"]  || '';
      node.attributes["Extra Info"] = newNode.attributes["Extra Info"] || '';
      node.attributes["Notes"]      = newNode.attributes["Notes"]      || '';
      // Copy to form
      this.setState({
        formData: {
          label:     node.label,
          type:      node.attributes["Node_Type"],     // HACK This needs to be updated when
          info:      node.attributes["Extra Info"],    // the data format is updated
          notes:     node.attributes["Notes"],         // These were bad keys from Fusion Tables.
          id:        node.id,
          isNewNode: false
        },
        isEditable:  false
      });

      this.validateForm();
    } // loadFormFromNode

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ validateForm () {
      let isValid = false;
      let formData = this.state.formData;

      if (formData.label!=='') isValid=true;
      if (DBG) console.log('NodeSElector.validateForm: Validating',isValid,'because label is',formData.label,'!');
      this.setState({
        isValid: isValid
      })
    }

/// UI EVENT HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// REVIEW: Do we really need to manage each input field change with a state update
/// or can we just grab the final text during the "SAVE"?
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onLabelChange (label) {
      // REVIEW: Currently this is not being called because AutoComplete
      // doesn't have a change handler
      let node = this.state.formData;
      node.label = label;
      this.setState({ formData: node });
      this.validateForm();
    } // onLabelChange
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onTypeChange (event) {
      let node = this.state.formData;
      node.type = event.target.value;
      this.setState({ formData: node });
    } // onTypeChange
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onNotesChange (event) {
      let node = this.state.formData;
      node.notes = event.target.value;
      this.setState({ formData: node });
    } // onNotesChange
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onInfoChange (event) {
      let node = this.state.formData;
      node.info = event.target.value;
      this.setState({ formData: node });
    } // onInfoChange
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onNewNodeButtonClick (event) {
      event.preventDefault();

      // clear AutoComplete form
      this.AppCall('AUTOCOMPLETE_SELECT',{id:thisIdentifier})
      .then(()=>{
        this.AppCall('SOURCE_SEARCH', { searchString: '' });
      });
      // HACK: call server to retrieve an unused node ID
      // FIXME: this kind of data manipulation should not be in a GUI component
      DATASTORE.PromiseNewNodeID()
      .then((newNodeID)=>{
        this.setState({
          formData: {
              label:     '',
              type:      '',
              info:      '',
              notes:     '',
              id:        newNodeID,
              isNewNode: true
          },
          edges: [],
          isEditable:      true,
          isValid:         false
        });

        this.validateForm();
      });
    } // onNewNodeButtonClick
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onEditButtonClick (event) {
      event.preventDefault();
      this.setState({ isEditable: true });
      // Add ID if one isn't already defined
      let formData = this.state.formData;
      if (formData.id==='') {
        throw Error('NodeSelector.onEditButtonClick trying to edit a node with no id!  This shouldn\'t happen!');
      }
      this.AppCall('AUTOCOMPLETE_SELECT',{id:thisIdentifier}).then(()=>{
        // Set AutoComplete field to current data, otherwise, previously canceled label
        // might be displayed
        this.AppCall('SOURCE_SEARCH', { searchString: formData.label });
      });
      this.setState({ formData });
      this.validateForm();
    } // onEditButtonClick
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onAddNewEdgeButtonClick (event) {
      event.preventDefault();
      /*
            When creating a new edge, we first
            1. Add a bare bones edge object with a new ID to the local state.edges
            2. Pass it to render, so that a new EdgeEditor will be created.
            3. In EdgeEditor, we create a dummy edge object
      */

      // HACK: call server to retrieve an unused edge ID
      // FIXME: this kind of data manipulation should not be in a GUI component
      DATASTORE.PromiseNewEdgeID()
      .then((newEdgeID)=>{
        // Add it to local state for now
        let edge = {
          id          : newEdgeID,
          source      : undefined,
          target      : undefined,
          attributes  : {}
        };
        let edges = this.state.edges;
        edges.push(edge);
        this.setState({ edges: edges });
      });
    } // onAddNewEdgeButtonClick
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onCancelButtonClick () {
      // If we were editing, then revert and exit
      if (this.state.isEditable) {
        let originalNode = this.AppState('D3DATA').nodes.filter( node => { return node.id === this.state.formData.id; } )[0];
        if (originalNode===undefined) {
          // user abandoned editing a new node that was never saved
          this.clearForm();
        } else {
          // restore original node
          this.loadFormFromNode( originalNode );
          this.setState({ isEditable: false });
        }
        this.AppCall('AUTOCOMPLETE_SELECT', {id:'search'});
      }
    } // onCancelButtonClick
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ onSubmit ( event ) {
      event.preventDefault();
      // Update the data with the selectedNode
      let formData = this.state.formData;
      let node = {
        label : formData.label,
        id    : formData.id,
        attributes: {
          'Node_Type'  : formData.type,
          'Extra Info' : formData.info,
          'Notes'      : formData.notes
        }
      };
      this.setState({ isEditable: false });
      // clear AutoComplete form
      this.AppCall('AUTOCOMPLETE_SELECT',{id:'search'})
      .then(()=>{
        // Reselect the saved node
        this.AppCall('SOURCE_SEARCH', { searchString: node.label });
      });
      // write data to database
      // setting dbWrite to true will distinguish this update
      // from a remote one
      this.AppCall('DB_UPDATE', { node });
    } // onSubmit


/// REACT LIFECYCLE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ componentWillMount () {
      this.validateForm();
    }
/*/ REACT calls this to receive the component layout and data sources
/*/ render () {
      return (
        <div>
          <FormGroup className="text-right" style={{paddingRight:'5px'}}>
            <Button outline size="sm"
              hidden={this.state.isEditable}
              onClick={this.onNewNodeButtonClick}
            >{"Add New Node"}</Button>
          </FormGroup>
          <Form className='nodeEntry' style={{minHeight:'300px',backgroundColor:'#B8EDFF',padding:'5px',marginBottom:'0px'}}
            onSubmit={this.onSubmit}>
            <FormText><b>NODE {this.state.formData.id||''}</b></FormText>
            <FormGroup row>
              <Col sm={3}>
                <Label for="nodeLabel" className="small text-muted">Label</Label>
              </Col>
              <Col sm={9}>
                <AutoComplete
                  identifier={thisIdentifier}
                  disabledValue={this.state.formData.label}
                  inactiveMode={'disabled'}
                  shouldIgnoreSelection={this.state.isEditable}
                />
              </Col>
            </FormGroup>
            <div style={{position:'absolute',left:'300px',maxWidth:'300px'}}>
              <NodeDetail/>
            </div>
            <FormGroup row>
              <Col sm={3}>
                <Label for="type" className="small text-muted">Type</Label>
              </Col>
              <Col sm={9}>
                <Input type="select" name="type" id="typeSelect"
                  value={this.state.formData.type||''}
                  onChange={this.onTypeChange}
                  disabled={!this.state.isEditable}
                  >
                  {this.state.options.map( (option,i) => (
                    <option id={option.id} key={option.id}>{option.label}</option>
                  ))}
                </Input>
              </Col>
            </FormGroup>
            <FormGroup row>
              <Col sm={3}>
                <Label for="notes" className="small text-muted">Notes</Label>
              </Col>
              <Col sm={9}>
                <Input type="textarea" name="note" id="notesText"
                  value={this.state.formData.notes||''}
                  onChange={this.onNotesChange}
                  readOnly={!this.state.isEditable}
                  />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Col sm={3}>
                <Label for="info" className="small text-muted">Geocode or Date</Label>
              </Col>
              <Col sm={9}>
                <Input type="text" name="info" id="info"
                  value={this.state.formData.info||''}
                  onChange={this.onInfoChange}
                  readOnly={!this.state.isEditable}
                  />
              </Col>
            </FormGroup>
            <FormGroup className="text-right" style={{paddingRight:'5px'}}>
              <Button outline size="sm"
                hidden={this.state.isEditable || (this.state.formData.id==='') }
                onClick={this.onEditButtonClick}
              >{"Edit Node"}</Button>
              <Button outline size="sm"
                hidden={!this.state.isEditable}
                onClick={this.onCancelButtonClick}
              >{this.state.isEditable?'Cancel':'Close'}</Button>&nbsp;
              <Button color="primary" size="sm"
                disabled={!this.state.isValid}
                hidden={!this.state.isEditable}
              >Save</Button>
            </FormGroup>
          </Form>
          <div style={{backgroundColor:'#B9DFFF',padding:'5px',marginBottom:'10px'}}>
            <FormText>EDGES</FormText>
            {/* `key` is needed during edge deletion so EdgeEditors are properly
                 removed when an edge is deleted.
                 REVIEW: Can we replace edgeID with key?  */}
            {this.state.edges.map( (edge,i) => (
              <EdgeEditor
                edgeID={edge.id}
                key={edge.id}
                parentNodeLabel={this.state.formData.label}
              />
            ))}
            <FormGroup className="text-right">
              <Button outline size="sm"
                hidden={this.state.formData.id===''||this.state.isEditable}
                onClick={this.onAddNewEdgeButtonClick}
              >Add New Edge</Button>
            </FormGroup>
          </div>
        </div>
      )
    }
} // class NodeSelector


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeSelector;