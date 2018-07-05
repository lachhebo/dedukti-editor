"use strict";

const { Convert } = require("atom-languageclient");
const dk = require("./dedukti-editor-view");
const fs = require('fs');

class Utils {

  static initialize(deduktiEditorView){
    this.view = deduktiEditorView
  }

  static manageView(dedukti_client){ // ow the view is handled by Atom

    dedukti_client._disposable.add(atom.workspace.addOpener( (uri) => {
      if(uri === this.view.getURI()){ //We want our opener to be active only for this uri
        return this.view; // We return the view
      }
    }));

    dedukti_client._disposable.add(
      atom.workspace.observeActiveTextEditor(editor => {
        //
        if (typeof editor != "undefined"){
          let scopeName = editor.getGrammar().scopeName;
          if(dedukti_client.getGrammarScopes().includes(scopeName)){
            atom.workspace.open(this.view.getURI()); // if it is not alrealdy open, We open the view
            this.adaptViewToEditor(dedukti_client); // we just update it.
          }
          else{
            atom.workspace.hide(this.view.getURI()); //if not a .dk file, the view is closed
          }
        }
        else{
          atom.workspace.hide(this.view.getURI()); //if not a .dk file, the view is closed
        }
      })
    );
  }

  static addKeyBindings(){ // add some keybindings

    atom.commands.add("atom-workspace", {
      "dedukti-editor:next": () => this.view.nextFocus() // CTRL ALT P
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:last": () => this.view.lastFocus() // CTRL ALT M
    });

  }

  static addeventbutton() { // add some listener for buttons

    this.view.but2.addEventListener("click", () => {
      this.view.nextFocus();
    });

    this.view.but3.addEventListener("click", () => {
      this.view.lastFocus();
    });

    //TODO ACTIVATE AUTOMATIC UPDATE
  }

  static colorBuffer(params) {
    // every variable we need.
    let path = Convert.uriToPath(params.uri);
    let i = 0;
    let z = 0;
    let j = 0;
    var mydiagnostics = new Array();
    let text_editors = atom.workspace.getTextEditors(); // we get all active editors in atom
    let editor = "";

    //we want to get the editor concerned by the diagnostics
    for (j = 0; j < text_editors.length; j++) {
      let text_editor_path = text_editors[j].getPath();
      if (text_editor_path == path) {
        editor = text_editors[j];
      }
    }

    if (editor === "") {
      //the editor concerned by the diagnostics is not open.
      return [];
    } else {
      //we destroy previous color markers on this editor
      let marker_color = editor.findMarkers({ persistent: false });
      for (z = 0; z < marker_color.length; z++) {
        marker_color[z].destroy();
      }
    }
    // Then we put new color markers on this editor

    for (i = 0; i < params.diagnostics.length; i++) {
      if (params.diagnostics[i].message === "OK") {
        //  Hence Green
        var marker = editor.markScreenRange([
          [
            params.diagnostics[i].range.start.line,
            params.diagnostics[i].range.start.character
          ],
          [
            params.diagnostics[i].range.end.line,
            params.diagnostics[i].range.end.character
          ]
        ]);
        marker.setProperties({ persistent: false, invalidate: "touch" }); //The color is diseappearing when 'touch'
        let decoration = editor.decorateMarker(marker, {
          type: "line-number",
          class: "Completed_lines"
        });
      } else {
        // Hence, in red
        var marker = editor.markScreenRange([
          [
            params.diagnostics[i].range.start.line,
            params.diagnostics[i].range.start.character
          ],
          [
            params.diagnostics[i].range.end.line,
            params.diagnostics[i].range.end.character
          ]
        ]);
        marker.setProperties({ persistent: false, invalidate: "touch" }); //The color disappears when 'touch'
        let decoration = editor.decorateMarker(marker, {
          type: "text",
          class: "Failed_line"
        });
        // we want those message to be displayed on the diagnostics panel.
        mydiagnostics.push(params.diagnostics[i]);
      }
    }
    // we return errors message to be displayed on the diagnostics panel.
    return mydiagnostics;
  }

  static add_editor_event(editor) { // NOT HERE OK
    // add some listener for cursor in an editor

    if(typeof this.currentcursor != "undefined"){
      this.currentcursor.dispose(); //We doesn't need to listen the last file cursor
    }
    if(typeof this.currentcursor != "undefined"){
      this.currentEditorUnicode.dispose();
    }

    this.currentcursor = editor.onDidChangeSelectionRange(selection => {
      this.view.updateView(selection, editor);
    });

    let i =0;
    for(i=0;i<this.parser.length;i++){
      editor.scan(
        new RegExp(this.parser[i].regex),
        (iterator) =>{
          console.log(iterator);
          iterator.replace(this.parser[i].unicode);
        }
      );
    }

    this.currentEditorUnicode = editor.onDidStopChanging( (data) => {
      let i = 0;
      let j = 0;
      for(j=0;j<data.changes.length;j++){
        for(i=0;i<this.parser.length;i++){
          editor.scanInBufferRange(
            new RegExp(this.parser[i].regex),
            [
              [data.changes[j].newRange.start.row, 0],
              [data.changes[j].newRange.end.row +1, data.changes[0].newRange.end.colum]
            ],
            (iterator) =>{
              console.log(iterator);
              iterator.replace(this.parser[i].unicode);
            }
          );
        }
      }
    });

  }


  static adaptViewToEditor(dedukti_client){ // We update the view when we switch from an editor to another one. // NOT HERE OK

    if (this.view.isInitialized()){ // We check it is correctly initialized
      this.add_editor_event(atom.workspace.getActiveTextEditor()); // add cursor event
    }
    else{
      this.view.initialize();
      this.add_editor_event(atom.workspace.getActiveTextEditor()); // add cursor event
      this.addeventbutton(); // add events for the buttons within the view
    }

  }


  static getkeymaps(){

    this.parser = JSON.parse(fs.readFileSync("/home/isma/Documents/dedukti-editor/src/parser.json", 'utf8'));

    console.log(this.parser);
  }
}


exports.default = Utils;
