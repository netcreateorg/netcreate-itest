/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const { ReactListKey: RLK } = require('./react-settings-client');
import TextInput from './MURTextInput';

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { groupName, title, description } = props;
  return (
    <span key={RLK('GN')}>
      <b>{title || groupName}</b>
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
      propsUI.push(<TextInput name={name} metadata={metadata} key={RLK('TI')} />);
  });
  const { title, description } = layout._groupMeta || {};
  return (
    <div key={RLK('PG')} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader
            groupName={groupName}
            description={description}
            title={title}
          />
        </summary>
        {description && (
          <p style={{ color: 'gray', fontStyle: 'italic' }}>{description}</p>
        )}
        <ui-group group={groupName}>{propsUI}</ui-group>
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
