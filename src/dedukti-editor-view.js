class DeduktiEditorView {
  constructor() {
    // It's just a simple web page created using the DOM API.

    // Create root element

    this.element = this.createCustomElement("div",["dedukti-editor"],"proofview",null,null);

    //First title
    this.proof = this.createCustomElement("h2",["highlight", "title-goals"],null,"Goals",this.element);

    //The tree
    this.list_of_proof = this.createCustomElement("ol",[],null,null,this.element);

    //Second Title
    this.focus = this.createCustomElement("h2",["highlight", "title-goals"],null,"Focus",this.element);

    //List of Hypothesis :
    this.list_of_hypothesis = this.createCustomElement("ol",["list-group"],null,null,this.element);

    //bar
    this.bar = this.createCustomElement("hr",["bar-proof"],null,null,this.element);

    //Current objective
    this.current_objective = this.createCustomElement("span",["icon","icon-microscope","proof-objectif"],null, "Exemple d'objectif courant",this.element);

    //Button toolbar at the buttom of the page :
    this.div_button = this.createCustomElement("div",["btn-toolbar", "proof-button"],null,null,this.element);

    //First goup of buttons :
    this.div_button_first = this.createCustomElement("div",["btn-group"],null,null,this.div_button);

    // Buttons :
    this.but1 = this.createCustomElement("button",["btn"],"first" ,"Bouton 1",this.div_button_first);
    this.but2 = this.createCustomElement("button",["btn"],"second","Bouton 2",this.div_button_first);
    this.but3 = this.createCustomElement("button",["btn"],"third" ,"Bouton 3",this.div_button_first);

  }


  createCustomElement(type, classlist, id, textcontent, parentnode){

    let element = document.createElement(type);
    let i;

    for(i=0;i<classlist.length;i++){
      element.classList.add(classlist[i]);
    }

    if(id !=null){
      element.setAttribute("id",id);
    }
    if(textcontent != null){
      element.textContent = textcontent;
    }
    if(parentnode != null){
      parentnode.appendChild(element);
    }

    return element;

  }

  getElement() {
    return this.element;
  }

  getTitle() {
    // Title of the Information Panel
    return "Proof Assistant";
  }

  getURI() {
    // Title of the Information Panel
    return "atom://active-editor-info";
  }

  getDefaultLocation() {
    //Position of the panel
    return "right";
  }

  getAllowedLocation() {
    //Where we can move it.
    return ["left", "right", "bottom"];
  }

  // An example to show how the view is looking.
  initialise_exemple() {
    let i = 0;
    for (i = 0; i < 20; i++) {
      let liste_i = document.createElement("li");
      liste_i.classList.add("focus_data");
      this.list_of_hypothesis.appendChild(liste_i);
      liste_i.innerText = "test" + i;
    }

    for (i = 0; i < 100; i++) {
      let liste_j = document.createElement("li");
      liste_j.classList.add("goals");
      this.list_of_proof.appendChild(liste_j);
      liste_j.innerText = "test" + i;
    }
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  //update the current objective
  setCurrentObjectif(current) {
    this.current_objective.innerText = current;
  }

  // A function to update the view when it's needed
  updateView() {}

  // A function to update the the goals list when it's needed
  updateSubProof() {
    //This function was created to handle a tree view and need to be rewritten
    let j;
    var new_list_of_proof = document.createElement("ol");

    for (j = 0; j < this.data_proof_array; j++) {
      var souspreuvre = document.createElement("li");
      souspreuvre.classList.add("list-nested-item");
      souspreuvre.setAttribute("id", this.data_proof_array[i].id);

      // On crée le sous arbre
      var sousarbre = document.createElement("ul");
      sousarbre.classList.add("entries", "list-tree");

      var div = document.createElement("div");
      div.classList.add("header", "list-item");

      var span = document.createElement("span");
      span.innerText = this.data_proof_array[i].name;
      div.appendChild(span);

      // On ajoute les elements à la preuve
      souspreuvre.appendChild(div);
      souspreuvre.appendChild(sousarbre);

      if (this.data_proof_array[i].parent_id === 0) {
        new_list_of_proof.appendChild(souspreuvre);
        span.classList.add("icon", "icon-key");
      } else {
        span.classList.add("icon", "icon-link");
        let parent_tree = document.getElementById(
          this.data_proof_array[i].parent_id
        );
        let children = parent_tree.childNodes;
        let list_tree = children.item(1);
        list_tree.appendChild(souspreuvre);
      }
    }

    this.list_of_proof = this.element.replaceChild(
      new_list_of_proof,
      this.list_of_proof
    );
  }

  // A function to update the the hypothesis list when it's needed
  updateHypothesis(hypothesis_array) {
    //This function was created to handle a tree view and need to be rewritten
    let new_list_of_hypothesis = document.createElement("ol");

    let i;
    for (i = 0; i < hypothesis_array.length; i++) {
      var hypothesis = document.createElement("li");
      hypothesis.classList.add("list-item");

      var span = document.createElement("span");
      span.classList.add("icon", "icon-bookmark");
      span.innerText = hypothesis_array[i];
      hypothesis.appendChild(span);
      new_list_of_hypothesis.append(hypothesis);
    }

    this.list_of_hypothesis = this.element.replaceChild(
      new_list_of_hypothesis,
      this.list_of_hypothesis
    );
  }

  // Not usefull yet, may be useless
  cursor_tree_update(id) {
    //This function was created to handle a tree view and need to be rewritten
    let to_colorize = document.getElementById(id);

    let children = to_colorize.childNodes;
    let div = children.item(0);
    let span = div.childNodes.item(0);

    span.classList.remove("icon-key", "icon-link");
    span.classList.add("icon-eye-watch");
  }

  //get the data sent by the server ( seems useless now and not complexity-wise smart)
  set_data_array(data_server) {
    this.data_proof_array = data_server;
  }

}

exports.default = DeduktiEditorView;
