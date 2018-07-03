"use strict";

const dk = require("./dedukti-editor-view");
const URL = require("url");
const child_process = require("child_process");
const {
  AutoLanguageClient,
  DownloadFile,
  Convert
} = require("atom-languageclient");

const actionProviderComposer = require('./provider');

class DeduktiLanguageClient extends AutoLanguageClient {
  constructor() {
    // at the opening of Atom
    super();

    atom.config.set("core.debugLSP", true); // Debug by default;
    this.config = require("./config.json"); // To modify the configuration, check the setting view
  }

  getGrammarScopes() {
    return ["source.dedukti"];
  }

  getLanguageName() {
    return "Dedukti";
  }

  getServerName() {
    return "lp-lsp";
  }

  startServerProcess(projectPath) {
     //  await new Promise(resolve => atom.whenShellEnvironmentLoaded(resolve));
    // we get the command and args from the setting panel

    var command = atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath");
    var args = atom.config.get("dedukti-editor.DeduktiSettings.lspServerArgs");

    /* // Debug for developper (isma)
    var command_test = "./lp-lsp_test";
    const childProcess = child_process.spawn(command_test, args,{
    cwd: "/home/isma/"
    });
    // */

    // a new process is created and send back
    const childProcess = child_process.spawn(command, args);
    return childProcess;
  }



  activate() {
    super.activate();

    // create the view and variables we will need to handle the extensions.
    this.deduktiEditorView = new dk.default();

    this.manageView();
    this.addKeyBindings();


  }


  manageView(){

    this._disposable.add(atom.workspace.addOpener( (uri) => {
      if(uri === module.exports.deduktiEditorView.getURI()){ //We want our opener to be active only for this uri
        return module.exports.deduktiEditorView; // We return the view
      }
    }));

    this._disposable.add(
      atom.workspace.observeActiveTextEditor(editor => {
        //
        if (typeof editor != "undefined"){
          let scopeName = editor.getGrammar().scopeName;
          if(this.getGrammarScopes().includes(scopeName)){
            atom.workspace.open(this.deduktiEditorView.getURI()); // if it is not alrealdy open, We open the view
            this.adaptViewToEditor(); // we just update it.
          }
          else{
            atom.workspace.hide(this.deduktiEditorView.getURI()); //if not a .dk file, the view is closed
          }
        }
        else{
          atom.workspace.hide(this.deduktiEditorView.getURI()); //if not a .dk file, the view is closed
        }
      })
    );

  }

  addKeyBindings(){ // add some keybindings

    atom.commands.add("atom-workspace", {
      "dedukti-editor:command1": () => this.command1()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:command2": () => this.command2()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:command3": () => this.command3()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:next": () => this.deduktiEditorView.nextFocus()
    });
    atom.commands.add("atom-workspace", {
      "dedukti-editor:last": () => this.deduktiEditorView.lastFocus()
    });

  }


  addeventbutton() {
    // add some listener for buttons

    this.deduktiEditorView.but1.addEventListener("click", () => {
      module.exports.command1();
    });

    this.deduktiEditorView.but2.addEventListener("click", () => {
      this.deduktiEditorView.nextFocus();
    });

    this.deduktiEditorView.but3.addEventListener("click", () => {
      this.deduktiEditorView.lastFocus();
    });
    //TODO ACTIVATE AUTOMATIC UPDATE
  }

  preInitialization(connection) {

    // we hack onPublishDiagnostics message before it is received by atom and handle positive message
    connection.onPublishDiagnostics = function(callback) {
      if (!module.exports.deduktiEditorView.isInitialized()){
        module.exports.deduktiEditorView.initialize();
      }
      let mycallback = function(params) {
        params.diagnostics = this.deduktiEditorView.updateDiagnostics(
          params.diagnostics,
          Convert.uriToPath(params.uri)
        );
        let mydiagnostics = this.colorizebuffer(params);
        params.diagnostics = mydiagnostics;
        callback(params);
      };
      connection._onNotification(
        { method: "textDocument/publishDiagnostics" },
        mycallback.bind(module.exports)
      );
    };


    //TODO WORKAROUND AGAINST ISSUE NUMERO 1

    this.connect_server = connection;


  }

  handleSpawnFailure(err) {
    //TODO: Use the `which` module to provide a better error in the case of a missing server.
    atom.notifications.addError(
      "Error starting the language server: " +
      atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath"),
      {
        dismissable: true,
        description:
        "Please make sure you've followed the Installation section in the README and that the server is functional"
      }
    );
  }

  colorizebuffer(params) {
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

  add_event_cursor(editor) {
    // add some listener for cursor in an editor

    if(typeof this.currentcursor != "undefined"){
      this.currentcursor.dispose(); //We doesn't need to listen the last file cursor
    }

    this.currentcursor = editor.onDidChangeSelectionRange(selection => {
      this.deduktiEditorView.updateView(selection, editor);
    });

  }

  //In case the a key binding or a button is activated, we send message to the server
  command1() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey1",
      []
    );
  }
  command2() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey2",
      []
    );
  }
  command3() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey3",
      []
    );
  }

  adaptViewToEditor(){ // We update the view when we switch from an editor to another one.

    if (this.deduktiEditorView.isInitialized()){ // We check it is correctly initialized
      this.add_event_cursor(atom.workspace.getActiveTextEditor()); // add cursor event
    }
    else{
      this.deduktiEditorView.initialize();
      this.add_event_cursor(atom.workspace.getActiveTextEditor()); // add cursor event
      this.addeventbutton(); // add events for the buttons within the view
    }

  }



  provideCodeActions() {
    return actionProviderComposer(
      this,
      this.provideType,
      this.provideValue
    )
  }

  provideType(editor, range, diagnostic, languageClient) {
    return {
      getTitle() { return Promise.resolve("provide Type") },
      dispose() {},
      apply() {
        return Promise.resolve(
            console.log("test 1")
          )
      }
    }
  }

  provideValue(editor, range, diagnostic, languageClient) {
    return {
      getTitle() { return Promise.resolve("provide Value") },
      dispose() {},
      apply() {
        return Promise.resolve(
            console.log("test 2")
          )
      }
    }
  }

}

module.exports = new DeduktiLanguageClient();
