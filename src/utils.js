"use strict";

const { Convert } = require("atom-languageclient");
const dk = require("./dedukti-editor-view");
const fs = require('fs');

class Utils {

  static initialize(dedukti_client){
    this.view = dedukti_client.deduktiEditorView;

    this.getkeymaps();
    this.addViewOpener(dedukti_client);
    this.addKeyBindings();
  }

  static addViewOpener(dedukti_client){ // ow the view is handled by Atom

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
      "dedukti-editor:next": () => this.view.nextFocus() // ALT down
    atom.commands.add("atom-workspace", {
      "dedukti-editor:last": () => this.view.lastFocus() // ALT up
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
        marker.setProperties({ persistent: false, invalidate: "never" }); //The color is diseappearing when 'touch'
        if(atom.config.get("dedukti-editor.style") === "bar_mode"){
          let decoration = editor.decorateMarker(marker, {
            type: "line-number",
            class: "Completed_lines"
          });
        }
        else if(atom.config.get("dedukti-editor.style") === "coloredline_mode"){
          let decoration = editor.decorateMarker(marker, {
            type: "text",
            class: "Completed_lines_colored_mode"
          });
        }
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
       marker.setProperties({ persistent: false, invalidate: "never" }); //The color disappears when 'touch'
        if(atom.config.get("dedukti-editor.style") === "bar_mode"){
          let decoration = editor.decorateMarker(marker, {
            type: "line-number",
            class: "Failed_line"
          });
        }
        else if(atom.config.get("dedukti-editor.style") === "coloredline_mode"){
          let decoration = editor.decorateMarker(marker, {
            type: "text",
            class: "Failed_line"
          });
        }
        // we want those message to be displayed on the diagnostics panel.
        mydiagnostics.push(params.diagnostics[i]);
      }
    }
    // we return errors message to be displayed on the diagnostics panel.
    return mydiagnostics;
  }

  static add_editor_event(editor) { // NOT HERE OK
    // add some listener for cursor in an editor

    this.add_cursor_event(editor); // the cursor event which update the view
    this.add_parser_event(editor); // the parser event which update the buffer with unicode symbols.

  }

  static add_cursor_event(editor){

    if(typeof this.currentcursor != "undefined"){ //We check if it is the first time a file is opened
      this.currentcursor.dispose(); //We doesn't need to listen the last file cursor
    }

    //When the user move the cursor, we update the view
    this.currentcursor = editor.onDidChangeSelectionRange(selection => {
      this.view.updateView(selection, editor);
    });

  }

  static add_parser_event(editor){
    if(typeof this.currentEditorUnicode != "undefined"){ //We check if it is the first time a file is opened
      this.currentEditorUnicode.dispose(); //We doesn't need to listen the last file cursor
    }

    //When the change the text, we check the new changes with our parser.
    this.currentEditorUnicode = editor.onDidStopChanging( (data) => {
      let i = 0;
      let j = 0;
      for(j=0;j<data.changes.length;j++){ // For each changes
        for(i=0;i<this.parser.length;i++){ // For each parser traduction
          editor.scanInBufferRange(
            new RegExp(this.parser[i].regex), // get the regex associate with the traduction parser
            [
              [data.changes[j].newRange.start.row, 0],
              [data.changes[j].newRange.end.row +1, data.changes[0].newRange.end.colum]
            ], // scan uniquely next where changes have been made
            (iterator) =>{
              iterator.replace(this.parser[i].unicode);  // replace the regex finded by a unicode symbol
            }
          );
        }
      }
    });


    let i =0; // In case it is the first time the file is opened, we check the all content of the file.
    for(i=0;i<this.parser.length;i++){
      editor.scan(
        new RegExp(this.parser[i].regex,'g'), // the g argument is used to make sure the scan will find and replace every occurence of the regex
        (iterator) => {
          iterator.replace(this.parser[i].unicode);
        }
      );
    }

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
    // We read the parser.json file and put the result in our variable.
    this.parser = require("./config/parser.json")
  }
}


exports.default = Utils;
