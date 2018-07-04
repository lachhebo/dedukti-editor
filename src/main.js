"use strict";

const dk = require("./dedukti-editor-view");
const Utils  = require("./utils").default;
const URL = require("url");
const child_process = require("child_process");
const {
  AutoLanguageClient,
  DownloadFile,
  Convert
} = require("atom-languageclient");


class DeduktiLanguageClient extends AutoLanguageClient {
  constructor() {
    // at the opening of Atom
    super();

    atom.config.set("core.debugLSP", true); // Debug by default;
    this.config = require("./config.json"); // To modify the configuration, check the setting view
  }

  activate() {
    super.activate();

    // create the view and variables we will need to handle the extensions.
    this.deduktiEditorView = new dk.default();

    Utils.initialize(this.deduktiEditorView);
    Utils.manageView(this);
    Utils.addKeyBindings();
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
    // await new Promise(resolve => atom.whenShellEnvironmentLoaded(resolve));

    // we get the command and args from the setting panel
    var command = atom.config.get("dedukti-editor.DeduktiSettings.lspServerPath");
    var args = atom.config.get("dedukti-editor.DeduktiSettings.lspServerArgs");

     // Debug for developper (isma)
    var command_test = "./lp-lsp_test";
    const childProcess = child_process.spawn(command_test, args,{
    cwd: "/home/isma/"
    });
    // */

    // a new process is created and send back
    //const childProcess = child_process.spawn(command, args);
    return childProcess;
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
        let mydiagnostics = Utils.colorBuffer(params);
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

  //In case the a key binding or a button is activated, we send message to the server
  command() {
    this.connect_server.sendCustomNotification(
      "ProofAssistant/CapturedKey1",
      []
    );
  }


}

module.exports = new DeduktiLanguageClient();
