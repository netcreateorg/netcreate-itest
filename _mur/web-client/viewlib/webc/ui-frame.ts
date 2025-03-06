/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
  
  
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class UI_Frame extends HTMLElement {
  constructor() {
    super(); // Always call super first in constructor
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <slot name='head'></slot>
      <slot name='rack'></slot>
      <slot name='console'></slot>
    `;
    const wrapper = document.createElement('div');
    const style = document.createElement('style');

    style.textContent = `
      div { 
        background: tomato; 
        padding: 10px; 
        color: white; 
      }
      ::slotted(.console) {
        display:none;
      }  
    `;

    wrapper.textContent = 'Hello, I am a Frame component!';
    shadow.appendChild(style);
  }

  connectedCallback() {}

  disconnectedCallback() {}

  attributeChangedCallback(name, oldValue, newValue) {}
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UI_Frame;
