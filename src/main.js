"use strict";

const dk = require("./dedukti-editor-view");
const linter_push_v2_adapter_2 = require("./ProofAdapter");
const child_process = require("child_process");
const {AutoLanguageClient, DownloadFile} = require("atom-languageclient");


class DeduktiLanguageClient extends AutoLanguageClient {

  constructor () {

    super();

    atom.config.set("core.debugLSP", true);    // Debug by default;
    this.config = require("./config.json");

    // Create new keybindings:
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command1": () => this.command1()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command2": () => this.command2()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command3": () => this.command3()})

    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);

    /*
      atom.workspace.hide(this.deduktiEditorView); // should close the Proof Panel
      this.deduktiEditorView.destroy();
    */

  };

  getGrammarScopes(){
    return ["source.dedukti"];  // The server is launched for .dk file.
  };

  getLanguageName(){
    return "Dedukti";
  };

  getServerName(){
    return "lp-lsp";
  };

  preInitialization(connection) {
    atom.workspace.open(this.deduktiEditorView);

    this.connect_server = connection;
    connection.onCustom("ProofAssistant/Showcheckedfile",
    (e) => {
      this.apply_check_file(e);
    });
    connection.onCustom("ProofAssistant/UpdateView",
    (e) => {
      this.updateView(e);
    });
  };

  startServerProcess () {

    var command = atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath");
    var args = atom.config.get("dedukti-editor.DeduktiSettings.lspServerArgs");

    /* Debug for developper
      var command_test = "./lplsp_test";
      const childProcess = child_process.spawn(command_test, args,{
        cwd: "/home/isma/Documents/dedukti-editor/src"
      });

    */
    // TODO: Use the `which` module to provide a better error in the case of a missing server.
    const childProcess = child_process.spawn(command, args);

    // We are handling errors with this notification
    childProcess.on("error", err =>
      atom.notifications.addError("Error starting the language server: " + command, {
        dismissable: true,
        description: "Please make sure you've followed the Installation section in the README and that the server is functional"
      })
    );

    childProcess.on('exit', (code, signal) => {
      atom.workspace.hide(this.deduktiEditorView);
      this.deduktiEditorView.destroy();
    });

    super.captureServerErrors(childProcess)

    return childProcess;
  };

  startExclusiveAdapters(server) { //We changes some parameters here to changes which adapters handle diagnostics.
      super.startExclusiveAdapters(server);
      server.linterPushV2_Diagnostic = new linter_push_v2_adapter_2.default(server.connection);
      if (this._linterDelegate != null) {
          server.linterPushV2_Diagnostic.attach(this._linterDelegate);
      }
      server.disposable.add(server.linterPushV2_Diagnostic);
  }


  apply_check_file (e) {}; //The first command launch this function
  updateView(e){ this.deduktiEditorView.addSubProof(e); }; //The second command launch this function

  //In case the first key binding is activated
  command1(){ this.connect_server.didChangeTextDocument([]); };

  command2(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey2",[]); };

  command3(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey3",[]); };


}

module.exports = new DeduktiLanguageClient();
