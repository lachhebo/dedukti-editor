function actionProviderComposer(languageClient, ...providers) {
  return {
    grammarScopes: ["source.dedukti"],
    priority: 1,
    getCodeActions(editor, range, diagnostics) {
      try {
        return Promise.all(
          diagnostics.reduce((acc, diagnostic) =>
            acc.concat(
              providers
              .map(p => p(editor, range, diagnostic, languageClient))
              .filter(action => !!action)
              .reduce((_acc, action) => {
                if (!Array.isArray(action)) action = [action]
                return _acc.concat(action)
              }, [])
            )
          , [])
        ).catch(error => { languageClient.createNotification(
            1, `Error getting code actions for diagnostic: ${error.toString()}`
          )
        })
      } catch (error) {
        languageClient.createNotification(
          1, `Error getting code actions ${error.toString()}`
        )
      }
    }
  }
}

module.exports = actionProviderComposer
