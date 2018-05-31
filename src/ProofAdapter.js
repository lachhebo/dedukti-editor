"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("../node_modules/atom-languageclient/build/lib/convert");
const languageclient_1 = require("../node_modules/atom-languageclient/build/lib/languageclient");

class LinterPushV2Adapter {

    constructor(connection) {
      console.log("connected finaly");
        this._diagnosticMap = new Map();
        this._diagnosticCodes = new Map();
        this._indies = new Set();
        this.marker_color = new Array();
        console.log(this.marker_color);
        connection.onPublishDiagnostics(this.captureDiagnostics.bind(this));
    }

    captureDiagnostics(params) {
        const path = convert_1.default.uriToPath(params.uri);
        const codeMap = new Map();
        const messages = params.diagnostics.map((d) => {
            const linterMessage = this.diagnosticToV2Message(path, d);
            codeMap.set(getCodeKey(linterMessage.location.position, d.message), d.code);
            return linterMessage;
        });
        // We destroy all existing markers
        let z = 0;
        for(z= 0; z<this.marker_color.length;z++){
          this.marker_color[z].destroy();
        }

        //We get the good editor :
        let text_editors = atom.workspace.getTextEditors();

        let editor;
        let j;
        for(j=0;j<text_editors.length;j++){
          let text_editor_path = text_editors[j].getPath();
          console.log(text_editor_path);
          if(text_editor_path == path ){
            editor = text_editors[j];
          }
        }

        // Then we put colors on those editors
        let messaged_displayed = []; // The message on the diagnostic panel
        let i=0;
        for(i=0;i<messages.length;i++){
          if(messages[i].excerpt === "OK"){ // Hence Green
            var marker = editor.markScreenRange(
              [ [
                  messages[i].location.position.start.row,
                  messages[i].location.position.start.column
                ],
                [
                  messages[i].location.position.end.row,
                  messages[i].location.position.end.column
                ]
              ]
            );
            marker.setProperties({persistent:false, invalidate:'touch'}); //The color is diseappearing when 'touch'
            let decoration = editor.decorateMarker(marker, {type: 'text', class:'Completed_lines'});
            this.marker_color.push(marker); //We keep in memory which marker we have added.
          }
          else { // Hence, in red
            messaged_displayed.push(messages[i]); //

            var marker = editor.markScreenRange(
              [ [
                  messages[i].location.position.start.row,
                  messages[i].location.position.start.column
                ],
                [
                  messages[i].location.position.end.row,
                  messages[i].location.position.end.column
                ]
              ]
            );
            marker.setProperties({persistent:false, invalidate:'touch'}); //The color disappears when 'touch'
            let decoration = editor.decorateMarker(marker, {type: 'text', class:'Failed_line'});
            this.marker_color.push(marker); //We keep in memory which marker we have added.
          }
        }

        this._diagnosticMap.set(path, messaged_displayed);
        this._diagnosticCodes.set(path, codeMap);
        this._indies.forEach((i) => i.setMessages(path, messaged_displayed));
    }

    // From here, It's the same thing that on the classic adapter :
    dispose() {
        this.detachAll();
    }

    attach(indie) {
        this._indies.add(indie);
        this._diagnosticMap.forEach((value, key) => indie.setMessages(key, value));
        indie.onDidDestroy(() => {
            this._indies.delete(indie);
        });
    }

    detachAll() {
        this._indies.forEach((i) => i.clearMessages());
        this._indies.clear();
    }

    diagnosticToV2Message(path, diagnostic) {
        return {
            location: {
                file: path,
                position: convert_1.default.lsRangeToAtomRange(diagnostic.range),
            },
            excerpt: diagnostic.message,
            linterName: diagnostic.source,
            severity: LinterPushV2Adapter.diagnosticSeverityToSeverity(diagnostic.severity || -1),
        };
    }

    static diagnosticSeverityToSeverity(severity) {
        switch (severity) {
            case languageclient_1.DiagnosticSeverity.Error:
                return 'error';
            case languageclient_1.DiagnosticSeverity.Warning:
                return 'warning';
            case languageclient_1.DiagnosticSeverity.Information:
            case languageclient_1.DiagnosticSeverity.Hint:
            default:
                return 'info';
        }
    }

    getDiagnosticCode(editor, range, text) {
        const path = editor.getPath();
        if (path != null) {
            const diagnosticCodes = this._diagnosticCodes.get(path);
            if (diagnosticCodes != null) {
                return diagnosticCodes.get(getCodeKey(range, text)) || null;
            }
        }
        return null;
    }
}
exports.default = LinterPushV2Adapter;
function getCodeKey(range, text) {
    return [].concat(...range.serialize(), text).join(',');
}
