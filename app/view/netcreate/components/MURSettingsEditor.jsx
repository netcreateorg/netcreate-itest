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
const PropertyGroup = require('./MURPropertyGroup');

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_settings = {}; // settings object split into subkeys
let m_propdefs = {}; // settings object split into subkeys
let m_layout = {}; // settings object split into subkeys
let m_key_hack = 0; // generates increasing key values for React
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this initiates the settings from the server. the settings module
 *  manages server updates and emits notifications */
UNISYS.Hook('LOADASSETS', async () => {
  if (Object.keys(m_settings).length > 0) return;
  m_settings = await Settings.Get();
  m_propdefs = m_settings.PropertyDefs;
  m_layout = m_settings.LayoutDef;
});
/** when app ready to start, subscribe to settings updates */
UNISYS.Hook('APP_READY', () => {
  Settings.Subscribe('*', data => {
    LOG(...PR('handleSettingsUpdate:', data));
  });
});

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React KeyHack to generate unique keys for lists of React components */
function KH(prefix) {
  if (typeof prefix !== 'string') prefix = Math.random().toString(36).substring(2, 5);
  return `${prefix}${m_key_hack++}`;
}

/// FUNCTIONAL COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a settings ui for rendering inside a React component */
function GeneratePropList() {
  const props = m_propdefs;
  const layouts = m_settings.LayoutDefs;
  const groupUI = [];
  Object.keys(m_propdefs).forEach(gn => {
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
    return <div>{propsUI}</div>;
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingEditor;
