class DeduktiEditorView {
  constructor() {
    // It's just a simple web page created using the DOM API.

    // Create root element
    this.element = this.createCustomElement(
      "div",
      ["dedukti-editor"],
      "proofview",
      null,
      null
    );

    //First title
    this.proof = this.createCustomElement(
      "h2",
      ["highlight", "title-goals"],
      null,
      "Goals",
      this.element
    );

    //The tree
    this.list_of_proof = this.createCustomElement(
      "ol",
      [],
      null,
      null,
      this.element
    );

    //Second Title
    this.focus = this.createCustomElement(
      "h2",
      ["highlight", "title-goals"],
      null,
      "Focus",
      this.element
    );

    //List of Hypothesis :
    this.list_of_hypothesis = this.createCustomElement(
      "ol",
      ["list-group", "hypo-list"],
      null,
      null,
      this.element
    );

    //bar
    this.bar = this.createCustomElement(
      "hr",
      ["bar-proof"],
      null,
      null,
      this.element
    );

    //Current objective
    this.current_objective = this.createCustomElement(
      "h3",
      ["proof-objectif","text-highlight"],
      null,
      "Exemple d'objectif courant",
      this.element
    );

    //Button toolbar at the buttom of the page :
    this.div_button = this.createCustomElement(
      "div",
      ["btn-toolbar", "proof-button"],
      null,
      null,
      this.element
    );

    //First goup of buttons :
    this.div_button_first = this.createCustomElement(
      "div",
      ["btn-group"],
      null,
      null,
      this.div_button
    );

    // Buttons :
    this.but1 = this.createCustomElement(
      "button",
      ["btn"],
      "first",
      "Bouton 1",
      this.div_button_first
    );
    this.but2 = this.createCustomElement(
      "button",
      ["btn"],
      "second",
      "Bouton 2",
      this.div_button_first
    );
    this.but3 = this.createCustomElement(
      "button",
      ["btn"],
      "third",
      "Bouton 3",
      this.div_button_first
    );

    this.dataView = [];
  }

  createCustomElement(type, classlist, id, textcontent, parentnode) {
    let element = document.createElement(type);
    let i;

    for (i = 0; i < classlist.length; i++) {
      element.classList.add(classlist[i]);
    }

    if (id != null) {
      element.setAttribute("id", id);
    }
    if (textcontent != null) {
      element.textContent = textcontent;
    }
    if (parentnode != null) {
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

    for (i = 0; i < 10; i++) {
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
  updateView(selection, editor) {
    console.log(editor);
    let path = editor.getPath();
    let i = 0;
    //console.log(selection);
    if (
      selection.newScreenRange.start.row == selection.newScreenRange.end.row &&
      selection.newScreenRange.start.column ==
        selection.newScreenRange.end.column
    ) {
      //console.log("new cusor detected");
      let row = selection.newScreenRange.start.row;
      let row_end = selection.newScreenRange.end.row;
      let column = selection.newScreenRange.start.column;
      let column_end = selection.newScreenRange.end.column;
      let none_objective = 0;

      for (i = 0; i < this.dataView.length; i++) {
        //console.log(this.dataView[i].range)
        if (
          this.dataView[i].path === path &&
          this.dataView[i].range.start.line <= row &&
          this.dataView[i].range.end.line >= row_end &&
          this.dataView[i].range.start.character <= column &&
          this.dataView[i].range.end.character >= column_end
        ) {
          this.setCurrentObjectif(this.dataView[i].goal);
          this.setHypothesis(this.dataView[i].hypothesis);
          //this.markGoal(this.dataView[i].goal);
          none_objective = 1;
        }
      }
      if(none_objective === 0){
        this.setCurrentObjectif("");
        this.cleanHypothesis();
      }
    }
  }

  markGoal(goalstring){
/*    let oldgoal = this.list_of_proof.getElementsByClassName("text-info");
    console.log(oldgoal);
    if( oldgoal = null){
      oldgoal.classList.remove("text-info");
    }
*/

    let goals = this.list_of_proof.getElementsByClassName("goals");
    //console.log(goals);
    let i = 0;
    let find =0;

    while(find ===0 && i<goals.length){
      console.log(goals[i].innerText);
      console.log(goalstring);
      console.log(goalstring.includes(goals[i].innerText))
      if(goalstring.includes(goals[i].innerText)){
        goals[i].classList.add("text-info");
        find = 1;
      }
      i++;
    }

  }

  setHypothesis(hypothesis){
    let i = 0;
    this.cleanHypothesis();

    for (i = 0; i <hypothesis.length; i++) {
      let liste_i = document.createElement("li");
      liste_i.classList.add("focus_data");
      this.list_of_hypothesis.appendChild(liste_i);
      liste_i.innerText = hypothesis[i];
    }
  }

  cleanHypothesis(){
    while (this.list_of_hypothesis.firstChild) {
      //The list is LIVE so it will re-index each call
      this.list_of_hypothesis.removeChild(this.list_of_hypothesis.firstChild);
    }
  }

  setGoals(){
    this.cleanGoals();
    let i=0;
    let datadisplayed = [];

    for (i = 0; i <this.dataView.length; i++) {
      if(!datadisplayed.includes(this.dataView[i].goal)){

        let liste_j = document.createElement("li");
        liste_j.classList.add("goals");
        this.list_of_proof.appendChild(liste_j);
        liste_j.innerText = this.dataView[i].goal;
        datadisplayed.push(this.dataView[i].goal);
      }
    }
  }

  cleanGoals(){
    while (this.list_of_proof.firstChild) {
      //The list is LIVE so it will re-index each call
      this.list_of_proof.removeChild(this.list_of_proof.firstChild);
    }
  }

  updateDiagnostics(data,text_editor_path) {
    console.log(text_editor_path);
    this.dataView = [];
    let diagnostics = [];
    let i;

    for (i = 0; i < data.length; i++) {
      if (
        data[i].message.includes("== Current goal ==========================")
      ) {
        let message = data[i].message.slice(43,-43);
        let messages = message.split("----------------------------------------")

        let curentobj = messages.pop();
        let j= 0;
        let goalhypothesis = [];

        for(j=0;j<messages.length;j++){
            let hypo = messages[j].split("\n");
            goalhypothesis = goalhypothesis.concat(hypo);
        }

        goalhypothesis.pop();

        if(curentobj.startsWith("\n")){
          curentobj = curentobj.substr(1);
        }

        this.dataView.push({
          path : text_editor_path,
          range: data[i].range,
          goal: curentobj,
          hypothesis : goalhypothesis
        });
      }
      else{
        diagnostics.push(data[i]);
      }
    }
    //this.setGoals();
    return diagnostics;
  }

  ////////////// A LIST OF OLD FUNCTIONS ////////////////////////
/*
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
*/
}


exports.default = DeduktiEditorView;
