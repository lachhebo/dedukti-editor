'use babel';

import DeduktiEditorView from './dedukti-editor-view';
import { CompositeDisposable } from 'atom';
import { File } from 'atom';

// We need to use terminal command, soq we require this package.
var cmd=require('node-cmd');
var replaceLast=require('replace-last');
// A global variable used to store the emplacement of the dedukti program
var dedukti_place;
//var utilisateur = "isma" //A string representing the name of the user name home directory


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
            '[ "1", [ "Send", "'+ text+'"]]'+'\n\n["2", ["Check", 0]]'
          )
          //We need to launch dedukti with the correct information :
          cmd.get(
              `
                cd $ATOM_HOME/packages/dedukti-editor/resources
                ./lptop.native < test_buffer.json

              `,
              function(err,data,stderr) {

                console.log(data);

                var array_string_json = data.split('\n');

                //console.log(array_string_json);

                let markers = editor.findMarkers(); //We are getting all markers ...
                for (i=0;i<markers.length;i++){ // ... and whe destroy them.
                  markers[i].destroy();
                }

                let selection = editor.getBuffer();
                var array_color_marker = new Array();
                var array_json = new Array();
                //var stop_cancelled = 0;
                var cancelled_where;

                for(i = 0; i< array_string_json.length-1; i++){ // For each line

                  var obj_json = JSON.parse(array_string_json[i]);
                  array_json.push(obj_json);
                  //console.log(obj_json);

                  if(array_json[i][0] === "Feedback")
                  {
                    //console.log("on est dans le if 2");
                    if(array_json[i][1].event[0] == "Parsed"){
                      let information = array_json[i][1].event[1];

                      var marker = editor.markScreenRange(
                        [[information.start_line-1, information.start_col],[information.end_line, information.end_col]]
                      );
                      marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'

                      array_color_marker.push(marker);
                      //console.log(information.start_line,information.start_col,information.end_line,information.end_col);
                      //console.log(marker.getScreenRange());

                      //console.log(range);
                    }
                    else if (array_json[i][1].event[0] === "Cancelled") {
                      decoration = editor.decorateMarker(array_color_marker[array_json[i][1].span_id], {type: 'text', class:'Failed_line'});
                      //stop_cancelled = 1;
                      cancelled_where = array_json[i][1].span_id+1;
                    }
                    else if (array_json[i][1].event[0] === "Completed") {
                        //console.log(array_json[i][1].span_id);
                        // We coloring the right marker with the right color
                        decoration = editor.decorateMarker(array_color_marker[array_json[i][1].span_id], {type: 'text', class:'Completed_lines'});
                    }
                    else if (array_json[i][1].event[0] === "Message") {
                      //if(array_json[i][1].event[1][0]== "Error"){
                      //  decoration = editor.decorateMarker(array_color_marker[array_json[i][1].span_id], {type: 'text', class:'Failed_line'});
                      //  stop_cancelled = 1;
                      //  cancelled_where = array_json[i][1].span_id +1;
                      //}
                    }
                  }
                }
                for(i=cancelled_where; i<array_color_marker.length; i++){
                  decoration = editor.decorateMarker(array_color_marker[i], {type: 'text', class:'Cancelled_line'});
                }
                //console.log(array_color_marker);
              }
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

      console.log(process.env['ATOM_HOME']);

      json_file = new File(process.env['ATOM_HOME']+"/packages/dedukti-editor/resources/test_buffer.json"); // en dur pour l'instant
      //console.log(json_file.getPath());

      json_file.create();



    }



  }



};
