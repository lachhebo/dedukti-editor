const dk = require('./dedukti-editor-view');
const ChildProcess = require("child_process");
const Path = require('path')
const {AutoLanguageClient} = require("atom-languageclient");

class DeduktiLanguageClient extends AutoLanguageClient {

  getGrammarScopes(){
    console.log('grammarscope');
    return ['source.dedukti']; // The server is launched for .dk file.
  }
  getLanguageName(){
    console.log('languagename');
    return 'Dedukti';
  }
  getServerName(){
    console.log('servername');
    return 'lptop';
  }

  startServerProcess () {
    console.log("start server");

    //We create and open the view when the server is started
    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);
    atom.workspace.open(this.deduktiEditorView);

    this.updateView(' (forall A : Prop, A -> A).');

    console.log(this.deduktiEditorView);
    console.log(dk.default);

    const command = './lptop.native';
    const args = [];
    var projectPath = Path.join(Path.dirname(__dirname), 'resources'); //We obtain the path of the location of the server

    const childProcess = ChildProcess.spawn(command, args, {
      cwd: projectPath
    }); // The process is launched

    // We are handling errors with this notification
    childProcess.on("error", err =>
      atom.notifications.addError("Unable to start the Dedukti language server.", {
        dismissable: true,
        description:
        "Please make sure you've followed the Installation section in the README"
      })
    );

    super.captureServerErrors(childProcess, projectPath)
    console.log(childProcess);
    return childProcess;

  }

  deactivate() {
    console.log("trying to shutdown the server");
    // We are closing the wiew when the server exit
    atom.workspace.open(this.deduktiEditorView); // should close the Proof Panel
    return Promise.race([super.deactivate(), this.createTimeoutPromise(2000)]);
  }

  createTimeoutPromise(milliseconds) {
      console.log("shutdown the server");
      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          clearTimeout(timeout);
          this.logger.error(`Server failed to shutdown in ${milliseconds}ms, forcing termination`);
          resolve();
        }, milliseconds);
    });
  }

/* How it's done on the java-ide
  preInitialization(connection) {
    connection.onCustom('language/status', (e) => this.updateStatusBar(`${e.type.replace(/^Started$/, '')} ${e.message}`))
    connection.onCustom('language/actionableNotification', this.actionableNotification.bind(this))
}
*/

  preInitialization(connection) { // We add our two new commands
    connection.onCustom('ProofAssistant/Showcheckedfile',
    (e) => {
      this.apply_check_file(e);
    });
    connection.onCustom('ProofAssistant/UpdateView',
    (e) => {
      this.updateView(e);
    });
  }

  apply_check_file (e) {
    // To implement
    /*
    Pseudo-code :
      for each ColorSpan
      color the ColorSPan.rangeSpan of the buffer with the color
      of ColorSpan.intColor

    */
  }

  updateView(e){
    // To implement
    /*
    Pseudo-code :
      for each ColorSpan
      replace the current goal with those added by this
      replace the backgoals with ..
      color in a special color the focusRange
    */
    this.deduktiEditorView.addSubProof(e);
  }

}

module.exports = new DeduktiLanguageClient();
