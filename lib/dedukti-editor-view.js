'use babel';

export default class DeduktiEditorView {


  constructor(serializedState, preuve, aim, list_of_proof, list_of_hypothesis, current_objective, array_hypo, array_proof) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('dedukti-editor');

    /*
    this.titre = document.createElement('h1');
    this.titre.textContent = 'Proof Helper';
    //preuve.classList.add('preuve');
    this.element.appendChild(this.titre);
    */

    this.preuve = document.createElement('h2');
    this.preuve.textContent = 'What you still need to do :';
    this.element.appendChild(this.preuve);

    this.list_of_proof = document.createElement('ul');
    this.element.appendChild(this.list_of_proof);

    this.aim = document.createElement('h2');
    this.aim.textContent = 'What you are doing :';
    this.element.appendChild(this.aim);

    this.list_of_hypothesis = document.createElement('ul');
    this.element.appendChild(this.list_of_hypothesis);

    //const barre_element;

    this.current_objective = document.createElement('p');
    this.element.appendChild(this.current_objective);


    this.array_hypo = new Array();
    this.array_proof = new Array();


    /*
    var heading = document.createElement("h1");
    var heading_text = document.createTextNode("Proof Helper");
    heading.appendChild(heading_text);
    document.body.appendChild(heading);
    */

  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  addSubProof(subproof_string){
    var subproof =  document.createElement('li');
    subproof.innerText = subproof_string;
    //console.log(this.list_of_proof);
    this.list_of_proof.append(subproof);
    this.array_proof.push(subproof);
  }

  addHypothesis(hypothese){
    var hypothesis =  document.createElement('li');
    hypothesis.innerText = hypothese;
    this.list_of_hypothesis.append(hypothesis);
    this.array_hypo.push(hypothesis);
  }

  retireSubProof(subproof){
    for(i=0;i<array_proof.length;i++){
      if(array_hypo.innerText == subproof){
        this.list_of_proof.remove(array_proof[i]);
        break;
      }
    }
  }

  retireHypothesis(hypothese){
    for(i=0;i<array_hypo.length;i++){
      if(array_hypo.innerText == hypothese){
        this.list_of_hypothesis.remove(array_hypo[i]);
        break;
      }
    }
  }

  setCurrentObjectif(current){
    this.current_objective.innerText = current;
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
