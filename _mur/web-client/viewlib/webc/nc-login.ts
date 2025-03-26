/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
  
  Proof of concept web component
  Does not use StatelyElement...needs update?
  
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const LOG = console.log.bind(console);

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** generic token decoder interface */
type TokenData = {
  error?: string; // true for invalid token, message in hint
  hint?: string; // current decoded status
  parts?: string[]; // decoded parts of token
};
interface Validator {
  decodeToken(token: string): TokenData;
}

/// WEB COMPONENT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NCLoginControl extends HTMLElement {
  //
  validator: Validator;

  constructor() {
    super();
    // create shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
    <div class="--NCLoginControl">
      <span>type your login token</span>
      <input name="sessionToken" type="text" placeholder="CLASSID-PROJID-CODE" />
      <button>LOGIN</button>
    </div>
    `;
    // attach event listeners
    const input = shadow.querySelector('input');
    input.addEventListener('input', this.onInput.bind(this));
    const button = shadow.querySelector('button');
    button.addEventListener('click', this.onSubmit.bind(this));
    // add styling
    const style = document.createElement('style');
    style.textContent = ``;
    shadow.appendChild(style);
    // is UR available?
    if (globalThis.UR) {
      const PR = globalThis.UR.ConsoleStyler('nclogin');
      LOG(...PR('UR is defined in nc-login globalThis'));
    }
  }

  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const token = input.value;
    if (this.validator) {
      console.log('validating token');
      const data = this.validator.decodeToken(token);
      const hint = data.error ? data.hint : 'valid token';
      input.title = hint;
    }
  }

  onSubmit(e: Event) {
    const input = this.shadowRoot.querySelector('input') as HTMLInputElement;
    const token = input.value;
    const data = this.validator.decodeToken(token);
    if (data.error) {
      alert(data.hint);
      return;
    }
    alert('login success');
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCLoginControl;
