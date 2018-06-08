
class DeduktiEditorView {

  constructor() {

        // It's just a simple web page created using the DOM API.

       // Create root element
       this.element = document.createElement('div');
       this.element.classList.add('dedukti-editor');

        this.proof = document.createElement('h2');
        this.proof.textContent = 'Goals';
        this.element.appendChild(this.proof);

        this.proof.classList.add("highlight");
        this.proof.style.textAlign = "center";

        this.list_of_proof = document.createElement('ul');
        this.element.appendChild(this.list_of_proof);

        this.list_of_proof.classList.add("list-group");

        this.focus = document.createElement('h2');
        this.focus.textContent = 'Focus';
        this.element.appendChild(this.focus);

        this.focus.classList.add("highlight");
        this.focus.style.textAlign = "center";

        this.list_of_hypothesis = document.createElement('ul');
        this.element.appendChild(this.list_of_hypothesis);

        this.list_of_hypothesis.classList.add("list-group");

        this.bar = document.createElement('hr')
        this.element.appendChild(this.bar);

        this.current_objective = document.createElement('span');
        this.element.appendChild(this.current_objective);

        this.current_objective.classList.add('icon','icon-microscope');


        // The array we need to store the element we are going to create :
        this.array_hypo = new Array();
        this.array_proof = new Array();

        //The style modification we implement :
        console.log(this.proof.style);

    /*    this.proof.style.paddingLeft = '40%';
        this.proof.style.paddingRight = '50%';
        this.proof.style.backgroundColor = 'white'
        this.proof.style.color = 'black'

        this.focus.style.paddingLeft = '40%';
        this.focus.style.paddingRight = '50%';
        this.focus.style.backgroundColor = 'white'
        this.focus.style.color = 'black'


    */
  }

  initialise_exemple(){

    this.addSubProof("exemple de rendu : subgoal 1");
    this.addSubProof("exemple de rendu :  subgoal 2");
    this.addSubProof("exemple de rendu :  subgoal 3");


    this.addHypothesis("exemple de rendu : hypothesis 1");
    this.addHypothesis("exemple de rendu : hypothesis 2");
    this.addHypothesis("exemple de rendu : hypothesis 3");



    this.setCurrentObjectif("exemple de rendu : goal");
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
  this.element.remove();
  }

  addSubProof(subproof_string){
    var subproof =  document.createElement('li');
    subproof.classList.add("list-item");

    var span = document.createElement('span');
    span.classList.add('icon','icon-question');
    //console.log(span);
    span.innerText = subproof_string;
    subproof.appendChild(span);

    //console.log(this.list_of_proof);
    this.list_of_proof.append(subproof);
    this.array_proof.push(subproof);
  }

  addHypothesis(hypothese){
    var hypothesis =  document.createElement('li');
    hypothesis.classList.add("list-item");

    var span = document.createElement('span');
    span.classList.add('icon','icon-tag');
    //console.log(span);
    span.innerText = hypothese;
    hypothesis.appendChild(span);


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
  return 'Proof Assistant'; // Title of the Information Panel
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


exports.default = DeduktiEditorView;
