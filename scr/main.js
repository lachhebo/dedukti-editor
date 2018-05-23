const dk = require('./dedukti-editor-view');
const ChildProcess = require("child_process");
const Path = require('path')
const {AutoLanguageClient} = require("atom-languageclient");

class DeduktiLanguageClient extends AutoLanguageClient {
  // The server is launched for .dk file.
  getGrammarScopes(){
    console.log('grammarscope');
    return ['source.dedukti'];
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
    this.deduktiEditorView = new dk.default(null, null, null, null, null, null, null);

    atom.workspace.open(this.deduktiEditorView);


    this.updateView(' (forall A : Prop, A -> A).');

    console.log(this.deduktiEditorView);

    console.log(dk.default);
    const command = './lptop.native';
    const args = [];
    var projectPath = Path.join(Path.dirname(__dirname), 'resources');

    const childProcess = ChildProcess.spawn(command, args, {
      cwd: projectPath
    });

    childProcess.on("error", err =>
      atom.notifications.addError("Unable to start the Dedukti language server.", {
        dismissable: true,
        description:
        "Please make sure you've followed the INstallation section in the README"
      })
    );

    super.captureServerErrors(childProcess, projectPath)
    console.log(childProcess);
    return childProcess;

  }

  deactivate() {
    console.log("trying to shutdown the server");
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

  preInitialization(connection) {
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
