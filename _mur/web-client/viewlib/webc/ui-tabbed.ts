/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
  
  Tabbed Panel Web Component  

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// WEB COMPONENT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCTabbedView extends HTMLElement {
  //
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /** lifecycle: called when inserted, moved, removed-reattached to DOM **/
  connectedCallback() {
    this.render();
  }

  /** creates the tab bar for divs with 'data-tabname' attribute **/
  render() {
    const slots = Array.from(this.querySelectorAll('div[data-tabname]'));
    if (slots.length === 0) {
      this.shadowRoot.innerHTML = '<div>[No tab views defined]</div>';
      return;
    }
    // programmatically create buttons for each slot
    let tabsHTML = '';
    slots.forEach(slot => {
      const label = slot.getAttribute('data-tabname');
      tabsHTML += `<button>${label}</button>`;
    });
    this.shadowRoot.innerHTML = `
      <style>
        .tabs button { color:gray; border:none;padding:4px 8px; } 
        .tabs button.active { color:black; }
      </style>
      <div class="tabs">${tabsHTML}</div>
      <div class="content"><slot></slot></div>
    `;
    // attach event listeners
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach((button, i) => {
      button.addEventListener('click', () => this.selectTab(i));
    });
    // hide all but the first slot
    this.selectTab(0);
  }

  selectTab(slotIndex: number) {
    const slot = this.shadowRoot.querySelector('slot');
    const slots = slot ? slot.assignedElements() : [];
    slots.forEach((el, i) => {
      if (el instanceof HTMLElement) {
        el.style.display = slotIndex === i ? 'block' : 'none';
      }
    });
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach((button, i) => {
      button.classList.toggle('active', i === slotIndex);
    });
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCTabbedView;
