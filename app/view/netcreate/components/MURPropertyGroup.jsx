/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const { ReactListKey: RLK } = require('./react-settings-bridge');
import TextInput from './MURTextInput';

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { group, title, description } = props;
  return (
    <span key={RLK('GN')}>
      <b>{title || group}</b>
    </span>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PropertyGroup(props) {
  // properties and layout are scoped to the groupname
  const { group, properties, layout } = props;
  if (typeof group !== 'string') return <p>PropertyGroup bad group</p>;
  if (!properties) return <p>PropertyGroup bad properties</p>;
  const propsUI = [];
  Object.entries(properties).forEach(([name, def]) => {
    const metadata = { ...def, ...layout[name] };
    if (def.type)
      propsUI.push(
        <TextInput group={group} name={name} metadata={metadata} key={RLK('TI')} />
      );
  });
  const { title, description } = layout._groupMeta || {};
  return (
    <div key={RLK('PG')} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader group={group} description={description} title={title} />
        </summary>
        {description && (
          <p style={{ color: 'gray', fontStyle: 'italic' }}>{description}</p>
        )}
        <ui-group group={group}>{propsUI}</ui-group>
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
