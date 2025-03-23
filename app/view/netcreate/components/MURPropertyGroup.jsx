/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
import TextInput from './MURTextInput';

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let reactKeyHack = 0;
function KK(prefix) {
  if (typeof prefix !== 'string') prefix = Math.random().toString(36).substring(2, 5);
  return `${prefix}${reactKeyHack++}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { groupName } = props;
  return (
    <span key={KK('GN')}>
      <b>{groupName}</b>
    </span>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PropertyGroup(props) {
  // properties and layout are scoped to the groupname
  const { groupName, properties, layout } = props;
  if (typeof groupName !== 'string') return <p>getPropertyGroup bad groupName</p>;
  if (!properties) return <p>getPropertyGroup no groupProps</p>;
  const propsUI = [];
  Object.entries(properties).forEach(([name, def]) => {
    const metadata = { ...def, ...layout[name] };
    if (def.type)
      propsUI.push(<TextInput name={name} metadata={metadata} key={KK('TI')} />);
  });
  return (
    <div key={KK('PG')} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader groupName={groupName} />
        </summary>
        <ui-group group={groupName}>{propsUI}</ui-group>
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
