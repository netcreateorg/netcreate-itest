/* eslint-disable no-alert */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { Settings, ConsoleStyler } = require('ursys-min');
const {
  ReactListKey: KH,
  GetPropertyDefs,
  GetLayoutDefs
} = require('./react-settings-client');
const PropertyGroup = require('./MURPropertyGroup');

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);

/// FUNCTIONAL COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a settings ui for rendering inside a React component */
function GeneratePropList() {
  const props = GetPropertyDefs();
  const layouts = GetLayoutDefs();
  const groupUI = [];
  Object.keys(props).forEach(gn => {
    groupUI.push(
      <PropertyGroup
        groupName={gn}
        properties={props[gn]}
        layout={layouts[gn]}
        key={KH('GRP')}
      />
    );
  });
  return groupUI;
}

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MURSettingEditor extends UNISYS.Component {
  constructor(props) {
    super(props);
    // UNISYS.Component already has UDATA and exposes these handlers
    // see client-react-component.jsx for more info
    this.handleSettingsUpdate = this.handleSettingsUpdate.bind(this);
  }

  /// REACT LIFECYCLE ///

  async componentDidMount() {
    Settings.Subscribe('*', this.handleSettingsUpdate);
    // props are sorted in order they are merged in mur-settings-mgr.mts
  }

  componentWillUnmount() {
    Settings.Unsubscribe('*', this.handleSettingsUpdate);
  }

  /// DATA EVENT HANDLERS ///

  /** called after subscribing via Settings.Subscribe() */
  handleSettingsUpdate(data) {
    const { settings, group, prop } = data;
  }

  /// RENDERED OUTPUT ///

  render() {
    const propsUI = GeneratePropList();
    return (
      <div>
        <ul>
          <li>graph name</li>
          <li>graph description</li>
          <li>secret key (for tokens)</li>
          <li>admin password</li>
          <li>
            Node Definitions
            <ul>
              <li>
                Node Type
                <ul>
                  <li>1: [label, color]</li>
                  <li>2: [label, color]</li>
                  <li>...7</li>
                </ul>
              </li>
              <li>Notes -- label, type, hide</li>
              <li>Info -- label, type, hide</li>
              <li>InfoSource -- label, type, hide</li>
            </ul>
          </li>
          <li>
            Edge Definitions
            <ul>
              <li>
                Edge Type
                <ul>
                  <li>1: [label, color]</li>
                  <li>2: [label, color]</li>
                  <li>...7</li>
                </ul>
              </li>
              <li>Notes -- label, type, hide</li>
              <li>InfoOrigin -- label, type, hide</li>
              <li>Citation -- label, type, hide</li>
              <li>Category -- label, type, hide</li>
            </ul>
          </li>
          <li>
            Comment Types
            <ul>
              <li>slug</li>
              <li>label</li>
              <li>
                prompts
                <ul>
                  <li>1: [format, prompt, help, feedback]</li>
                  <li>2: [format, prompt, help, feedback]</li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
        <p>NOTES: </p>
        <ul>
          <li>
            `isProvenance` will place a field in the Proveannce tab. But we do not
            expect teachers to need to change that.
          </li>
        </ul>
      </div>
    );
    // return <div>{propsUI}</div>;
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingEditor;
