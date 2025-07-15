/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Array Input Component
  Handle a list of setting options in a variable length array

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { ConsoleStyler } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);
const PR = ConsoleStyler('InText', 'TagBlue');

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { itemGrid, labelStyle, inputStyle, popupStyle, modColor } = RSB.GetStyles();

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ExtractArrayProps(controlData) {
  if (typeof controlData !== 'object')
    return { error: `arg1 must be an object, got ${typeof controlData}` };

  const { groupName, propName, propField } = controlData;
  const { sourceMeta, sourceData } = controlData;

  // do something relevant to arrays

  return [];
}

/// ARRAY INPUT COMPONENT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A TextInput component */
function ArrayInput(props) {
  // propName, groupName.propName, or groupName.propName.fieldName
  const { propDef } = props;
  const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
  // controlData contains what's needed to render this input component
  const controlData = RSB.GetDataForProp(draft.template, propDef);
  const { name, label, tooltip, help, placeholder, value } =
    m_ExtractArrayProps(controlData);

  // do something...see CompositeInput.jsx for inspiration
  const ArrayObjects = [];

  return (
    <div
      style={{
        margin: '1rem 0'
      }}
    >
      Would render an ArrayInput for {name}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ArrayInput;
