/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Settings To Do List
  This is just a list of things that need to be done, imported by
  MURSettingsEditor.jsx as a reminder of what needs to be done.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');

/// TO DO LIST ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = (
  <div>
    <p>
      This list is defined in MURSettingsToDo.jsx and imported by
      MURSettingsEditor.jsx.
    </p>
    <ul>
      <li>
        graphName <tt>:string</tt>
      </li>
      <li>
        graphDescription <tt>:string</tt>
      </li>
      <li>
        secretKey (for tokens) <tt>:string</tt>
      </li>
      <li>
        adminPassword <tt>:string</tt>
      </li>
      <li>
        Node Definitions
        <ul>
          <li>
            Node Type
            <ul>
              <li>
                1: [label<tt>:string</tt>, color<tt>:colorChoice</tt>]
              </li>
              <li>...7</li>
            </ul>
          </li>
          <li>
            Notes: label<tt>:string</tt>, hide
            <tt>:boolean</tt>
          </li>
          <li>
            Info: label<tt>:string</tt>, hide<tt>:boolean</tt>
          </li>
          <li>
            InfoSource: label<tt>:string</tt>, hide
            <tt>:boolean</tt>
          </li>
        </ul>
      </li>
      <li>
        Edge Definitions
        <ul>
          <li>
            Edge Type
            <ul>
              <li>
                1: [label<tt>:string</tt>, color<tt>:colorChoice</tt>]
              </li>
              <li>...7</li>
            </ul>
          </li>
          <li>
            Notes: label<tt>:string</tt>, hide
            <tt>:boolean</tt>
          </li>
          <li>
            InfoOrigin: label<tt>:string</tt>, hide
            <tt>:boolean</tt>
          </li>
          <li>
            Citation: label<tt>:string</tt>, hide
            <tt>:boolean</tt>
          </li>
          <li>
            Category: label<tt>:string</tt>, hide
            <tt>:boolean</tt>
          </li>
        </ul>
      </li>
      <li>
        Comment Types
        <ul>
          <li>
            slug<tt>:string</tt>
          </li>
          <li>
            label<tt>:string</tt>
          </li>
          <li>
            prompts
            <ul>
              <li>
                1: [format<tt>:string</tt>, prompt<tt>:string</tt>, help
                <tt>:string</tt>, feedback<tt>:string</tt>]
              </li>
              <li>
                2: [format<tt>:string</tt>, prompt<tt>:string</tt>, help
                <tt>:string</tt>, feedback<tt>:string</tt>]
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
    <p>NOTES: </p>
    <ul>
      <li>
        `isProvenance` will place a field in the Proveannce tab. But we do not expect
        teachers to need to change that.
      </li>
      <li>
        Ideally teachers can add and remove new Node and Edge field definitions,
        rather merely re-purposing existing fields. e.g. they might add an Event Date
        field.
      </li>
    </ul>
  </div>
);
