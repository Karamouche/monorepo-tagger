// extension.js
const vscode = require("vscode");
const path = require("path");

function activate(context) {
	let disposable = vscode.commands.registerCommand(
		"monorepo-tagger.commitWithTag",
		async () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				vscode.window.showErrorMessage("No workspace folder open.");
				return;
			}

			const activeEditor = vscode.window.activeTextEditor;
			const filePath = activeEditor
				? activeEditor.document.fileName
				: workspaceFolders[0].uri.fsPath;
			const folderPath = path.dirname(filePath);
			const folderName = path.basename(folderPath);

			const config = vscode.workspace.getConfiguration("monorepo-tagger");
			const folderTagMap = config.get("folderTagMap", {});
			const excludeFolders = config.get("excludeFolders", []);

			if (excludeFolders.includes(folderName)) {
				// Proceed without a tag
				const commitMessage = await vscode.window.showInputBox({
					prompt: "Commit message",
				});

				if (commitMessage !== undefined) {
					const terminal = vscode.window.createTerminal("Git Commit");
					terminal.sendText(`git commit -m "${commitMessage}"`);
					terminal.show();
				}
				return;
			}

			let tag = folderTagMap[folderName];

			if (tag === undefined) {
				// Use folder name as tag by default
				tag = `(${folderName})`;
			}

			const commitMessage = await vscode.window.showInputBox({
				prompt: "Commit message",
				value: `${tag} `,
			});

			if (commitMessage !== undefined) {
				const terminal = vscode.window.createTerminal("Git Commit");
				terminal.sendText(`git commit -m "${commitMessage}"`);
				terminal.show();
			}
		}
	);

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
