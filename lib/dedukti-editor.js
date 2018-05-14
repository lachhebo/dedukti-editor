'use babel';

import DeduktiEditorView from './dedukti-editor-view';
import { CompositeDisposable } from 'atom';
import { File } from 'atom';

// We need to use terminal command, soq we require this package.
var cmd=require('node-cmd');
// A global variable used to store the emplacement of the dedukti program
var dedukti_place;
var utilisateur = "isma" //A string representing the name of the user name home directory


//var myview = 0;

export default {

  deduktiEditorView: null,
  modalPanel: null,
  subscriptions: null,


  activate(state) {
   this.deduktiEditorView = new DeduktiEditorView(state.deduktiEditorViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.deduktiEditorView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable(
      atom.workspace.addOpener(uri => {
          if (uri == 'atom://dedukti-editor'){
            return new DeduktiEditorView(); // We are creating and showing the Information Panel
          }
      })
    );

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'dedukti-editor:toggle': () => this.toggle()
    }));




    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:check', function check(){

        //stdout = (output) -> console.log(output)
        //exit = (code) -> console.log("ps -ef exited with #{code}")


        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

          //We need to write inside the json file what we want to transit :
          text = editor.getText();

          json_file.write(
            '[ "1", [ "Send", "'+ text+'"]]'+ '\n\n["2", ["Check", 0]]'
          )
          //We need to launch dedukti with the correct information :
          cmd.get(
              `
                cd github/dedukti-editor/resources
                ./lptop.native < test_buffer.json
              `,
              //'ls',
              function(err,data,stderr) {

                console.log('OUT2', data);

                //console.log(typeof data);
                var array = data.split('\n');
                console.log(array);
                console.log(array[1]);
                color_dedukti_lines = new Array(array.length);
                console.log(color_dedukti_lines);

                for(i = 0; i<array.length; i++){
                  color_dedukti_lines[i] = JSON.parse();
                }

                /*
                let string = readline(data) in
                  let obj = JSON.parse(string)

                //var json_data = JSON.parse(data);

                console.log(obj);
                */

                if( editor.getMarkerCount() == 0) // We are checking if we have already colored a line
                { // If NO :
                  let selection = editor.getBuffer();

                  for(i = 0; i<editor.getBuffer().getLineCount() ; i++){ // For each line
                            let range = selection.rangeForRow(i);
                            let marker = editor.markBufferRange(range); //

                            marker.setProperties({persistent:false, invalidate:'touch'}) //The color is diseappearing when 'touch'

                            if(i<5){ //Whe need to check the value of the json file
                              decoration = editor.decorateMarker(marker, {type: 'line', class:'Completed_lines'}); //Good line
                            }
                            else{
                              decoration = editor.decorateMarker(marker, {type: 'line', class:'Failed_line'}); //Bad Line
                            }
                  }

                }
                else
                { //If yes

                  let markers = editor.findMarkers(); //We are getting all markers ...
                  //console.log(markers);
                  //console.log(markers[])

                  for (i=0;i<markers.length;i++){ // and whe are destroying them.
                    markers[i].destroy();
                  }

                  /* Same Processus */
                  let selection = editor.getBuffer();

                  let Cancelled_line = 0;
                  for(i = 0; i<editor.getBuffer().getLineCount() ; i++){
                            let range = selection.rangeForRow(i);
                            let marker = editor.markBufferRange(range);

                            marker.setProperties({persistent:false, invalidate:'touch'})

                            if(true && Cancelled_line===0){
                              decoration = editor.decorateMarker(marker, {type: 'line', class:'Completed_lines'});
                            }
                            else if (false && Cancelled_line===0){
                              decoration = editor.decorateMarker(marker, {type: 'line', class:'Failed_line'});
                              Cancelled_line = 1;
                            }
                            else{
                              decoration = editor.decorateMarker(marker, {type: 'line', class:'Cancelled_line'});
                            }
                  }

                }
              },
          )

          //console.log(json_file.read());

        }
      }
    ));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:erase', function erase(){
        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

          let markers = editor.findMarkers();
          //console.log(markers);
          //console.log(markers[])

          for (i=0;i<markers.length;i++){ //We are erasing all colors defined.
            markers[i].destroy();
          }
        }
      }
    ));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:next_line', function next_line(){ //Not defined yet
        let editor
        if (editor = atom.workspace.getActiveTextEditor()){
          /*
          let markers = editor.findMarkers();
          console.log(markers);
          //console.log(markers[])

          decorations = editor.getLineDecorations();

          let i = 0;
          while (i<markers.length){
            console.log(markers[i].getProperties());

            i = i+1;
          }
        }
        */
      }
    }
    ));

    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'dedukti-editor:previous_line', function previous_line(){ //Not defined yet
        let editor
        if (editor = atom.workspace.getActiveTextEditor()){

        }
      }
    ));


  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.deduktiEditorView.destroy();
  },

/*
  serialize() {
    return {
      deduktiEditorViewState: this.deduktiEditorView.serialize()
    };
  },
*/

  toggle() {

    atom.workspace.toggle('atom://dedukti-editor');

    let editor
    if (editor = atom.workspace.getActiveTextEditor()){

      //This code is about making the color of the edited line the same as the color line.
      /*
      editor.onDidChangeCursorPosition(function color_line_focused() {

        //console.log(atom.styles.getStyleElements())

        let line_to_modify = editor.getCursorScreenPosition().row;

        //console.log(line_to_modify);
        decorations = editor.getLineDecorations();
        //console.log(decorations);
        let line_deco = decorations[line_to_modify].getProperties().class;
        //console.log(line_deco);

        let mark = editor.getLastCursor().getMarker();
        //console.log(mark)

        mark.setProperties({type:'line', class:line_deco})

      })
      */

      // We need to know where dedukti is installed by default :

      /*
      new (require("atom").BufferedNodeProcess)({
          //command: "./lptop.native",
          options: {shell: true},
          command: "find_dedukti.js",
          //args: ["dedukti"],
          stdout: function(out) { console.log("OUT", out);
                                  //atom.notifications.addSuccess("We found dedukti on your computer")
                                  //dedukti_place = out;
                                },
          stderr: function(out) { console.log("ERR", out);
                                /*  atom.notifications.addError("We did not found dedukti on your computer",
                                  {
                                    detail: "please make sure dedukti is installed on your home directory using opam,",
                                    dismissable: true
                                  })

                                }
      });
    //  */
      //console.log(dedukti_place);
      /*
      cmd.get(
        'whereis ocamlfind',
        function(err, data, stderr){
          console.log('OUT',data);
          dedukti_place = data;
          console.log(dedukti_place);

          //console.log('ERR', err);
        }
      );
      */

      json_file = new File("/home/"+utilisateur+"/github/dedukti-editor/resources/test_buffer.json"); // en dur pour l'instant
      //console.log(json_file.getPath());

      json_file.create();



    }



  }



};
