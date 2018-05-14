'use babel';

import DeduktiEditor from '../lib/dedukti-editor';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('DeduktiEditor', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('dedukti-editor');
  });

  describe('when the dedukti-editor:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.dedukti-editor')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'dedukti-editor:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.dedukti-editor')).toExist();

        let deduktiEditorElement = workspaceElement.querySelector('.dedukti-editor');
        expect(deduktiEditorElement).toExist();

        let deduktiEditorPanel = atom.workspace.panelForItem(deduktiEditorElement);
        expect(deduktiEditorPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'dedukti-editor:toggle');
        expect(deduktiEditorPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.dedukti-editor')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'dedukti-editor:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let deduktiEditorElement = workspaceElement.querySelector('.dedukti-editor');
        expect(deduktiEditorElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'dedukti-editor:toggle');
        expect(deduktiEditorElement).not.toBeVisible();
      });
    });
  });
});
