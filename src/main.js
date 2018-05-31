const dk = require("./dedukti-editor-view");
const linter_push_v2_adapter_2 = require("./ProofAdapter");
const os = require("os");
const ChildProcess = require("child_process");
const Path = require("path");
const fs = require("fs");
const {AutoLanguageClient, DownloadFile} = require("atom-languageclient");

// We need those modules to override the Diagnostics Adapter :
const linter_push_v2_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/linter-push-v2-adapter"); //this one
const apply_edit_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter");
const notifications_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/notifications-adapter");
const document_sync_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/document-sync-adapter");
const logging_console_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/logging-console-adapter");
const signature_help_adapter_1 = require("../node_modules/atom-languageclient/build/lib/adapters/signature-help-adapter");

class DeduktiLanguageClient extends AutoLanguageClient {

  constructor () {
    super();
    atom.config.set("core.debugLSP", true); // We activate the debug functionnality
    this.config = require("./config.json");
  };

  getGrammarScopes(){
    //The plan is to use this extension with other PA, not just dedukti.
    return ["source.dedukti"];  // The server is launched for .dk file.
  };

  getLanguageName(){
    //we choose the language name
    return  atom.config.get("dedukti-editor.DeduktiSettings.LanguageName");;
  };

  getServerName(){
    return  atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer");
  };

  startServerProcess () {
    //We create and open the view when the server is started
    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);
    atom.workspace.open(this.deduktiEditorView);

    // We are creating new key binding :
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command1": () => this.command1()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command2": () => this.command2()})
    atom.commands.add("atom-workspace",
      {"dedukti-editor:command3": () => this.command3()})

    // We are creating the data we need;
    var command = "";
    var args = []
    var projectPath = "";

    if(atom.config.get("dedukti-editor.DeduktiSettings.UseMyOwnServer") == false){ //do you use your own server
       command = "./lplsp";
       args = []
       projectPath = this.CheckServerPath();
    }
    else{
      projectPath = atom.config.get("dedukti-editor.DeduktiSettings.pathToMyServer");
      command = atom.config.get("dedukti-editor.DeduktiSettings.commandToLaunchIt");
      args = atom.config.get("dedukti-editor.DeduktiSettings.optionnal_arg");
    }

    const childProcess = ChildProcess.spawn(command, args, {
      cwd: projectPath
    }); // The process is launched

    // We are handling errors with this notification
    childProcess.on("error", err =>
      atom.notifications.addError("Unable to start the "+atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer")+" language server.", {
        dismissable: true,
        description:
        "Please make sure you've followed the Installation section in the README"
      })
    );

    super.captureServerErrors(childProcess, projectPath)

    return childProcess;
  };

  startExclusiveAdapters(server) { //We changes some parameters here to changes which adapters handle diagnostics.
      apply_edit_adapter_1.default.attach(server.connection);
      notifications_adapter_1.default.attach(server.connection, this.name, server.projectPath);
      if (document_sync_adapter_1.default.canAdapt(server.capabilities)) {
          server.docSyncAdapter =
              new document_sync_adapter_1.default(server.connection, (editor) => this.shouldSyncForEditor(editor, server.projectPath), server.capabilities.textDocumentSync);
          server.disposable.add(server.docSyncAdapter);
      }
      // Where we override the function frome here:
      server.linterPushV2 = new linter_push_v2_adapter_1.default(server.connection);
      server.linterPushV2_Diagnostics = new linter_push_v2_adapter_2.default(server.connection);

      if (this._linterDelegate != null) {
          server.linterPushV2_Diagnostics.attach(this._linterDelegate);
      }
      server.disposable.add(server.linterPushV2);
      server.linterPushV2_Diagnostics = new linter_push_v2_adapter_2.default(server.connection);
      // until here
      server.loggingConsole = new logging_console_adapter_1.default(server.connection);
      if (this._consoleDelegate != null) {
          server.loggingConsole.attach(this._consoleDelegate({ id: this.name, name: 'abc' }));
      }
      server.disposable.add(server.loggingConsole);
      if (signature_help_adapter_1.default.canAdapt(server.capabilities)) {
          server.signatureHelpAdapter = new signature_help_adapter_1.default(server, this.getGrammarScopes());
          if (this._signatureHelpRegistry != null) {
              server.signatureHelpAdapter.attach(this._signatureHelpRegistry);
          }
          server.disposable.add(server.signatureHelpAdapter);
      }
  }

  consumeLinterV2(registerIndie) { //We changes some parameters here to changes which adapters handle diagnostics.
      this._linterDelegate = registerIndie({ name: this.name });
      if (this._linterDelegate == null) {
          return;
      }
      for (const server of this._serverManager.getActiveServers()) {
          if (server.linterPushV2_Diagnostics != null) { // Our handler
              server.linterPushV2_Diagnostics.attach(this._linterDelegate);
          }
      }
  }

  preInitialization(connection) { // The two new commands we should add to have a cleaner code
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

  apply_check_file (e) {}; //The first command launch this function
  updateView(e){ this.deduktiEditorView.addSubProof(e); }; //The second command launch this function

  //In case the first key binding is activated
  command1(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey1",[]); };

  command2(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey2",[]); };

  command3(){ this.connect_server.sendCustomNotification("ProofAssistant/CapturedKey3",[]); };

  //atom.workspace.hide(this.deduktiEditorView); // should close the Proof Panel

  CheckServerPath(){ //We are looking where is installed the server
    if(this.isServerInstalled(__dirname)) { // in /src
      return __dirname;
    }
    if(this.isServerInstalled(Path.dirname(__dirname))){ // in /dedukti-editor
      return Path.dirname(__dirname);
    }
    else if(this.isServerInstalled(Path.join(Path.dirname(__dirname),"resources"))){ // in /resources
      return Path.join(Path.dirname(__dirname),"resources");
    }
    else{ //Not find
      atom.notifications.addError("Unable to find the "+atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer")+" language server.", {
        dismissable: true,
        description:
        "Please make sure the link you've put in the dedukti-editor folder is working (not broken), \n - try to create a new symlink (see README), \n - make sure the symlink is called lplsp"
      })
    }
  };

  isServerInstalled(serverHome) { //To test if a path contain our server
    let path_tested = Path.join(serverHome, atom.config.get("dedukti-editor.DeduktiSettings.nameOfServer"));
    return fs.existsSync(path_tested);
  };
  
}

module.exports = new DeduktiLanguageClient();
