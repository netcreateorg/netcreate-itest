/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NetGraph is a React wrapper for a D3 network graph component.

  This component uses React to create the base dom element, but ncGraphRenderer
  handles the data updates, rendering and animation updates.

  React is explicitly prevented from updating the component (see
  shouldComponentUpdate)

  ## TO USE

          <NCGraph/>

  ## Why not use FauxDom?

  https://lab.oli.me.uk/react-faux-dom-state/
  This article suggests that maybe using force graphs with react-faux-dom
  not quite work.
      "If you want to animate things, use a React animation library (they’re
        great and work fine with faux DOM), you have to find the React way to
        do things, sadly some D3 concepts just don’t translate. If you want
        some physics based graph full of state then you’re probably better
        off keeping to the original way of embedding D3 in React, dropping
        out of React and letting D3 mutate that element."
  Indeed, in our testing, the animation updates were not optimal.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const NCGraphRenderer = require('./NCGraphRenderer');
const UNISYS = require('unisys/client');
const RENDERMGR = require('../render-mgr');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCGraph';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCGraph extends UNISYS.Component {
  constructor(props) {
    super(props);
    this.state = {
      ncGraphRenderer: {},
      d3data: {},
      nodeTypes: [],
      edgeTypes: []
    };

    this.updateVData = this.updateVData.bind(this);
    this.updateTemplate = this.updateTemplate.bind(this);
    this.updateColorMap = this.updateColorMap.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.onZoomReset = this.onZoomReset.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);
    this.constructGraph = this.constructGraph.bind(this);

    this.OnAppStateChange('VDATA', this.updateVData);
    this.OnAppStateChange('TEMPLATE', this.updateTemplate);
    this.OnAppStateChange('COLORMAP', this.updateColorMap);
    this.OnAppStateChange('SELECTION', this.updateSelection);
    this.OnAppStateChange('HILITE', this.updateSelection);
    this.HandleMessage('CONSTRUCT_GRAPH', this.constructGraph);
  } // constructor

  /// CLASS PRIVATE METHODS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA METHODS
  /**
   *
   * @param {object} data
   * @param {array} data.nodes
   * @param {array} data.edges
   */
  updateVData(data) {
    if (DBG) console.log(PR, 'got state D3DATA', data, RENDERMGR);
    const d3data = RENDERMGR.ProcessNCData(data);
    this.state.ncGraphRenderer.SetData(d3data);
  }
  /**
   * Update default values when template has changed
   * @param {object} data TEMPLATE
   */
  updateTemplate(data) {
    if (DBG) console.log(PR, 'got state TEMPLATE', data);
    const TEMPLATE = this.AppState('TEMPLATE');
    // Update Legends
    const nodeTypes = TEMPLATE.nodeDefs.type.options;
    const edgeTypes = TEMPLATE.edgeDefs.type.options;
    // Update
    this.setState({ nodeTypes, edgeTypes }, () => {
      this.forceUpdate(); // just once, needed to overcome shouldComponentUpdate override
    });
  }
  /**
   * Node/Edge Colors in Template have been changed.
   * The template may be loaded or changed after NCDATA is loaded.
   * So we need to explicitly update the colors if the color
   * definitions have changed.
   */
  updateColorMap(data) {
    if (DBG) console.log(PR, 'got state COLORMAP', data);
    this.state.ncGraphRenderer.UpdateGraph();
  }
  /**
   *
   * @param {*} data
   */
  updateSelection(data) {
    if (DBG) console.log(PR, 'updateSelection', data);
    const d3data = RENDERMGR.UpdateSelection(data);
    this.state.ncGraphRenderer.SetData(d3data, { skipForceUpdate: true });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI METHODS

  /**
   */
  onZoomReset() {
    this.state.ncGraphRenderer.ZoomReset();
  }
  /**
   */
  onZoomIn() {
    this.state.ncGraphRenderer.ZoomIn();
  }
  /**
   */
  onZoomOut() {
    this.state.ncGraphRenderer.ZoomOut();
  }

  /// REACT LIFECYCLE ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  constructGraph() {
    // first destroy any existing SVG graph elements
    const netgraph = document.getElementById('netgraph');
    if (netgraph) netgraph.remove();

    // ncGraphRenderer Constructor
    const TEMPLATE = this.AppState('TEMPLATE');
    if (this.state.ncGraphRenderer && this.state.ncGraphRenderer.Deregister) {
      // if ncGraphRenderer was previously created, deregister it so it stops receiving data updates
      this.state.ncGraphRenderer.Deregister();
    }
    const ncGraphRenderer = new NCGraphRenderer(this.dom); // this.dom defined in render via ref
    try {
      const nodeTypes = TEMPLATE.nodeDefs.type.options;
      const edgeTypes = TEMPLATE.edgeDefs.type.options;
      this.setState({ ncGraphRenderer, nodeTypes, edgeTypes });
      this.forceUpdate(); // just once, needed to overcome shouldComponentUpdate override
    } catch (err) {
      console.warn('constructGraph error', err);
    }
  }

  /// REACT LIFECYCLE ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  componentDidMount() {
    this.constructGraph();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  componentWillUnMount() {
    this.AppStateChangeOff('VDATA', this.updateVData);
    this.AppStateChangeOff('TEMPLATE', this.updateTemplate);
    this.AppStateChangeOff('COLORMAP', this.updateColorMap);
    this.AppStateChangeOff('SELECTION', this.updateSelection);
    this.AppStateChangeOff('HILITE', this.updateSelection);
    this.DropMessage('CONSTRUCT_GRAPH', this.constructGraph);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  shouldComponentUpdate() {
    // This prevents React from updating the component,
    // allowing D3 to handle the simulation animation updates
    // This is also necessary for D3 to handle the
    // drag events.
    return false;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   */
  render() {
    const { nodeTypes, edgeTypes } = this.state;
    return (
      <div className="NCGraph" ref={dom => (this.dom = dom)}>
        <div className="zoom-buttons">
          <button onClick={this.onZoomIn} role="button" aria-label="Zoom In">
            <img src="/images/icn_plus.svg" alt="" />
          </button>
          &nbsp;
          <button onClick={this.onZoomReset} role="button" aria-label="Zoom Reset">
            <img src="/images/icn_circle.svg" alt="" />
          </button>
          &nbsp;
          <button onClick={this.onZoomOut} role="button" aria-label="Zoom Out">
            <img src="/images/icn_minus.svg" alt="" />
          </button>
        </div>
        <div className="legend">
          <h1>Node Types:</h1>
          {nodeTypes.map((type, i) => (
            <div key={i} className="tooltipAnchor">
              <div className="legend-item">
                <div className="swatch" style={{ backgroundColor: type.color }}></div>
                &nbsp;{type.label === '' ? 'No Type Selected' : type.label}
              </div>
              <span className="tooltiptextabove">
                {type.label === '' ? 'No Type Selected' : type.help || type.label}
              </span>
            </div>
          ))}
          <br></br>
          <h1>Edge Types:</h1>
          {edgeTypes.map((type, i) => (
            <div key={i} className="tooltipAnchor">
              <div className="legend-item">
                <div className="swatch" style={{ backgroundColor: type.color }}></div>
                &nbsp;{type.label === '' ? 'No Type Selected' : type.label}
              </div>
              <span className="tooltiptextabove">
                {type.label === '' ? 'No Type Selected' : type.help || type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
} // class NetGraph

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCGraph;
