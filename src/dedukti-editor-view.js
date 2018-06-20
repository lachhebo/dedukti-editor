class DeduktiEditorView {
  constructor() {
    // It's just a simple web page created using the DOM API.

    // Create root element
    this.element = this.createCustomElement(
      "div",
      ["dedukti-editor"],
      [{ name: "id", value: "proofview" }],
      null,
      null
    );

    //First title
    this.proof = this.createCustomElement(
      "h2",
      ["highlight", "title-goals"],
      [],
      "Goals",
      this.element
    );

    //The tree
    this.list_of_proof = this.createCustomElement(
      "table",
      ["goalstable"],
      [{ name: "align", value: "center" }],
      null,
      this.element
    );

    //Second Title
    this.focus = this.createCustomElement(
      "h2",
      ["highlight", "title-goals"],
      [],
      "Focus",
      this.element
    );

    //List of Hypothesis :
    this.list_of_hypothesis = this.createCustomElement(
      "ol",
      ["list-group", "hypo-list"],
      [],
      null,
      this.element
    );

    //bar
    this.bar = this.createCustomElement(
      "hr",
      ["bar-proof"],
      [],
      null,
      this.element
    );

    //Current objective
    this.current_objective = this.createCustomElement(
      "h3",
      ["proof-objectif", "text-highlight"],
      [],
      "Exemple d'objectif courant",
      this.element
    );

    //Button toolbar at the buttom of the page :
    this.div_button = this.createCustomElement(
      "div",
      ["btn-toolbar", "proof-button"],
      [],
      null,
      this.element
    );

    //First goup of buttons :
    this.div_button_first = this.createCustomElement(
      "div",
      ["btn-group"],
      [],
      null,
      this.div_button
    );

    // Buttons :
    this.but1 = this.createCustomElement(
      "button",
      ["btn"],
      [{ name: "id", value: "first" }],
      "Bouton 1",
      this.div_button_first
    );
    this.but2 = this.createCustomElement(
      "button",
      ["btn"],
      [{ name: "id", value: "second" }],
      "Bouton 2",
      this.div_button_first
    );
    this.but3 = this.createCustomElement(
      "button",
      ["btn"],
      [{ name: "id", value: "third" }],
      "Bouton 3",
      this.div_button_first
    );

    // DATA :
    this.dataView = [];

    // EVENT LISTENER :

    this.disposebutton = [];
  }

  /* This function help us creating the element we need on our web page */
  createCustomElement(type, classlist, attributes, textcontent, parentnode) {
    let element = document.createElement(type);
    let i;

    for (i = 0; i < classlist.length; i++) {
      element.classList.add(classlist[i]);
    }

    for (i = 0; i < attributes.length; i++) {
      element.setAttribute(attributes[i].name, attributes[i].value);
    }

    if (textcontent != null) {
      element.textContent = textcontent;
    }

    if (parentnode != null) {
      parentnode.appendChild(element);
    }

    return element;
  }

  /* A couple of basic functions to handle the view */
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
    // Just an example
    //editor
    let i;
    let datadisplayed = [];
    for (i = 0; i < this.dataView.length; i++) {
      if (!datadisplayed.includes(this.dataView[i].goal)) {
        datadisplayed.push({
          goal: this.dataView[i].goal,
          point: this.dataView[i].range.start
        });
      }
    }

    this.setGoals(datadisplayed, atom.workspace.getActiveTextEditor());
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  /* We get the data from diagnostics for the moment */
  updateDiagnostics(data, text_editor_path) {
    this.dataView = [];
    let i;

    for (i = 0; i < data.length; i++) {
      if (data[i].goal_fg != null) {
        let curentobj = data[i].goal_fg.type;
        let goalhypothesis = data[i].goal_fg.hyps;

        this.dataView.push({
          path: text_editor_path,
          range: data[i].range,
          goal: curentobj,
          hypothesis: goalhypothesis
        });
      }
    }

    this.initialise_exemple();

    return data;
  }

  // A function to update the focus part of the view when it's needed
  updateView(selection, editor) {
    let path = editor.getPath();
    let i = 0;
    if (
      selection.newScreenRange.start.row == selection.newScreenRange.end.row &&
      selection.newScreenRange.start.column ==
        selection.newScreenRange.end.column
    ) {
      let row = selection.newScreenRange.start.row;
      let column = selection.newScreenRange.start.column;
      let none_objective = 0;

      for (i = 0; i < this.dataView.length; i++) {
        if (
          this.rangewithin(
            this.dataView[i].path,
            this.dataView[i].range.start.line,
            this.dataView[i].range.end.line,
            this.dataView[i].range.start.character,
            this.dataView[i].range.end.character,
            path,
            row,
            column
          )
        ) {
          this.setCurrentObjectif(this.dataView[i].goal);
          this.setHypothesis(this.dataView[i].hypothesis);
          //this.markGoal(this.dataView[i].goal);
          none_objective = 1;
        }
      }
      if (none_objective === 0) {
        this.setCurrentObjectif("");
        this.cleanHypothesis();
      }
    }
  }

  /* A couple of function tu update each part of the view */

  //update the current objective
  setCurrentObjectif(current) {
    this.current_objective.innerText = current;
  }

  //update the hypothesis list
  setHypothesis(hypothesis) {
    let i = 0;
    this.cleanHypothesis();

    for (i = 0; i < hypothesis.length; i++) {
      let liste_i = document.createElement("li");
      liste_i.classList.add("focus_data");
      this.list_of_hypothesis.appendChild(liste_i);
      liste_i.innerText = hypothesis[i];
    }
  }

  //update the goals list (need a bit of rewrite)
  setGoals(goallist, editor) {
    this.cleanGoals();
    let i = 0;

    for (i = 0; i < goallist.length; i++) {
      let line = document.createElement("tr");
      line.classList.add("goalline");
      this.list_of_proof.appendChild(line);

      let firstcol = document.createElement("td");
      firstcol.classList.add("goalcolumn");
      console.log(firstcol);
      firstcol.innerText = goallist[i].goal;
      line.appendChild(firstcol);

      let secondcol = document.createElement("td");
      secondcol.classList.add("goalcolumn");
      line.appendChild(secondcol);

      let btn = document.createElement("button");
      btn.classList.add("btn", "btn-xs", "btn-info");
      btn.textContent = "go ! ";
      secondcol.appendChild(btn);

      this.addNewListener(goallist, i, btn, editor);
    }
  }

  addNewListener(goallist, index, button, editor) {
    button.addEventListener("click", function() {
      //console.log(goallist,index);
      editor.setCursorScreenPosition([
        goallist[index].point.line,
        goallist[index].point.character
      ]);
    });

    //this.markgoal(goallist[index].goal);
  }

  /* A couple of functions to clean the view */
  cleanHypothesis() {
    while (this.list_of_hypothesis.firstChild) {
      //The list is LIVE so it will re-index each call
      this.list_of_hypothesis.removeChild(this.list_of_hypothesis.firstChild);
    }
  }

  cleanGoals() {
    while (this.list_of_proof.firstChild) {
      //The list is LIVE so it will re-index each call
      this.list_of_proof.removeChild(this.list_of_proof.firstChild);
    }
  }

  /* A couple of function to enhance the user experience */

  //The aim of this function is to help the user finding which part of the goals list is related to the focus.
  markGoal(goalstring) {
    /*    let oldgoal = this.list_of_proof.getElementsByClassName("text-info");
    console.log(oldgoal);
    if( oldgoal = null){
      oldgoal.classList.remove("text-info");
    }
    */

    let goals = this.list_of_proof.getElementsByClassName("goals");
    //console.log(goals);
    let i = 0;
    let find = 0;

    while (find === 0 && i < goals.length) {
      //console.log(goals[i].innerText);
      //console.log(goalstring);
      //console.log(goalstring.includes(goals[i].innerText));
      if (goalstring.includes(goals[i].innerText)) {
        goals[i].classList.add("text-info");
        find = 1;
      }
      i++;
    }
  }

  //The aim of this function is to redirect the user cursor to a proof.
  goToProof() {
    //console.log("button");
  }

  /* Two function to handle key binding */
  nextFocus() {
    let editor = atom.workspace.getActiveTextEditor();
    let cursor = editor.getCursorScreenPosition();
    let path = editor.getPath();
    let point = this.closerNextRange(path, cursor.row, cursor.column);

    if (point != null) {
      editor.setCursorScreenPosition([point.line, point.character]);
    }
  }

  lastFocus() {
    let editor = atom.workspace.getActiveTextEditor();
    let cursor = editor.getCursorScreenPosition();
    let path = editor.getPath();
    let point = this.closerLastRange(path, cursor.row, cursor.column);

    if (point != null) {
      editor.setCursorScreenPosition([point.line, point.character]);
    }
  }

  ///* A couple of functions to deal with ranges */
  rangewithin(dvpath, dvRS, dvRE, dvCS, dvCE, apath, aR, aC) {
    if (dvpath != apath) {
      return false;
    }
    if (dvRS > aR) {
      return false;
    }
    if (dvRE < aR) {
      return false;
    }
    if (dvRS === aR && dvCS > aC) {
      return false;
    }
    if (dvRE === aR && dvCE < aC) {
      return false;
    }

    return true;
  }

  closerLastRange(path, row, column) {
    let i;
    let candidate = [];
    let min;
    let min_index;

    for (i = 0; i < this.dataView.length; i++) {
      if (this.dataView[i].path === path) {
        if (this.dataView[i].range.end.line < row) {
          let travel = row - this.dataView[i].range.end.line;
          candidate.push({
            distance: travel,
            index: i
          });
        } else if (this.dataView[i].range.end.line === row) {
          if (this.dataView[i].range.end.character < column) {
            let travel = (column - this.dataView[i].range.end.character) / 10;
            candidate.push({
              distance: travel,
              index: i
            });
          }
        }
      }
    }

    if (candidate.length > 0) {
      min = candidate[0].distance;
      min_index = candidate[0].index;
      for (i = 1; i < candidate.length; i++) {
        if (candidate[i].distance < min) {
          min = candidate[i].distance;
          min_index = candidate[i].index;
        }
      }
      return this.dataView[min_index].range.end;
    }

    return null;
  }

  closerNextRange(path, row, column) {
    let i;
    let candidate = [];
    let min;
    let min_index;

    for (i = 0; i < this.dataView.length; i++) {
      if (this.dataView[i].path === path) {
        if (this.dataView[i].range.start.line > row) {
          let travel = this.dataView[i].range.start.line - row;
          candidate.push({
            distance: travel,
            index: i
          });
        } else if (this.dataView[i].range.start.line === row) {
          if (this.dataView[i].range.start.character > column) {
            let travel = (this.dataView[i].range.start.character - column) / 10;
            candidate.push({
              distance: travel,
              index: i
            });
          }
        }
      }
    }

    if (candidate.length > 0) {
      min = candidate[0].distance;
      min_index = candidate[0].index;
      for (i = 1; i < candidate.length; i++) {
        if (candidate[i].distance < min) {
          min = candidate[i].distance;
          min_index = candidate[i].index;
        }
      }
      return this.dataView[min_index].range.end;
    }

    return null;
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
