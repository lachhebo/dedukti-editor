class DeduktiEditorView {
  constructor() {
    // It's just a simple web page created using the DOM API.

    // Create root element
    this.element = document.createElement("div");
    this.element.classList.add("dedukti-editor");
    this.element.setAttribute("id", "proofview");

    //First title
    this.proof = document.createElement("h2");
    this.proof.textContent = "Goals";
    this.element.appendChild(this.proof);
    this.proof.classList.add("highlight", "title-goals");

    //The tree
    this.list_of_proof = document.createElement("ol");
    this.element.appendChild(this.list_of_proof);
    //this.list_of_proof.classList.add("list-tree");
    //this.list_of_proof.setAttribute("id", "proof-tree");

    //Second Title
    this.focus = document.createElement("h2");
    this.focus.textContent = "Focus";
    this.element.appendChild(this.focus);
    this.focus.classList.add("highlight", "title-focus");

    //List of Hypothesis :
    this.list_of_hypothesis = document.createElement("ol");
    this.element.appendChild(this.list_of_hypothesis);
    this.list_of_hypothesis.classList.add("list-group");

    //bar
    this.bar = document.createElement("hr");
    this.element.appendChild(this.bar);
    this.bar.classList.add("bar-proof");

    //Current objective

    this.current_objective = document.createElement("span");
    this.element.appendChild(this.current_objective);
    this.current_objective.textContent = "Exemple d'objectif courant";
    this.current_objective.classList.add(
      "icon",
      "icon-microscope",
      "proof-objectif"
    );

    //Button toolbar at the buttom of the page :
    this.div_button = document.createElement("div");
    this.element.appendChild(this.div_button);
    this.div_button.classList.add("btn-toolbar", "proof-button");

    //First goup of buttons :
    this.div_button_first = document.createElement("div");
    this.div_button.appendChild(this.div_button_first);
    this.div_button_first.classList.add("btn-group");

    this.but1 = document.createElement("button");
    this.div_button_first.appendChild(this.but1);
    this.but1.setAttribute("id", "first");
    this.but1.textContent = "Bouton 1";
    this.but1.classList.add("btn");

    this.but2 = document.createElement("button");
    this.div_button_first.appendChild(this.but2);
    this.but2.setAttribute("id", "second");
    this.but2.textContent = "Bouton 2";
    this.but2.classList.add("btn");

    this.but3 = document.createElement("button");
    this.div_button_first.appendChild(this.but3);
    this.but3.setAttribute("id", "third");
    this.but3.textContent = "Bouton 3";
    this.but3.classList.add("btn");

    //.addEventListener("click", function(){
    //console.log("lalalala");
    //});
  }

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

  updateView() {}

  updateSubProof() {
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

  updateHypothesis(hypothesis_array) {
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

  cursor_tree_update(id) {
    let to_colorize = document.getElementById(id);

    let children = to_colorize.childNodes;
    let div = children.item(0);
    let span = div.childNodes.item(0);

    span.classList.remove("icon-key", "icon-link");
    span.classList.add("icon-eye-watch");
  }

  setCurrentObjectif(current) {
    this.current_objective.innerText = current;
  }

  set_data_array(data_server) {
    this.data_proof_array = data_server;
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    return "Proof Assistant"; // Title of the Information Panel
  }

  getURI() {
    return "atom://active-editor-info";
  }

  getDefaultLocation() {
    return "right"; //Position of the panel
  }

  getAllowedLocation() {
    return ["left", "right", "bottom"]; //Where we can move it.
  }
}

exports.default = DeduktiEditorView;
