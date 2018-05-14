'use babel';

export default class DeduktiEditorView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('dedukti-editor');

    // Create message element
    const preuve = document.createElement('div');
    preuve.textContent = 'Votre Preuve : ';
    preuve.classList.add('preuve');
    this.element.appendChild(preuve);



    const log = document.createElement('div');
    log.textContent = 'Vos Logs : ';
    log.classList.add('preuve');
    this.element.appendChild(log);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  getTitle(){
    return 'Preuve'; // Title of the Information Panel
  }

  getURI(){
    return 'atom://active-editor-info';
  }

  getDefaultLocation(){
    return 'right'; //Position of the panel
  }

  getAllowedLocation(){
    return ['left','right','bottom']; //Where we can move it.
  }

}
