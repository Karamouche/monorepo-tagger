// extension.js
const vscode = require("vscode");
const path = require("path");

function activate(context) {
	const disposableCommand = vscode.commands.registerCommand(
		"monorepo-tagger.insertTag",
		async () => {
			const gitExtension =
				vscode.extensions.getExtension("vscode.git").exports;
			const gitApi = gitExtension.getAPI(1);

			const activeEditor = vscode.window.activeTextEditor;
			const filePath = activeEditor
				? activeEditor.document.fileName
				: vscode.workspace.workspaceFolders[0].uri.fsPath;

			const workspaceFolder = vscode.workspace.getWorkspaceFolder(
				vscode.Uri.file(filePath)
			);

			if (!workspaceFolder) {
				vscode.window.showErrorMessage(
					"File is not within any workspace folder."
				);
				return;
			}

			// Get the highest-level folder name
			const relativePath = path.relative(
				workspaceFolder.uri.fsPath,
				filePath
			);
			const pathSegments = relativePath.split(path.sep);
			const folderName = pathSegments.length > 1 ? pathSegments[0] : null;

			const config = vscode.workspace.getConfiguration("monorepo-tagger");
			const folderTagMap = config.get("folderTagMap", {});
			const excludeFolders = config.get("excludeFolders", []);
			const tagEnclosure = config.get("tagEnclosure", "parentheses");

			if (folderName && excludeFolders.includes(folderName)) {
				vscode.window.showInformationMessage(
					"Current folder is excluded from tagging."
				);
				return;
			}

			let tag = folderName ? folderTagMap[folderName] : undefined;

			if (tag === undefined) {
				// Use folder name as tag by default
				tag = folderName || "";
			}

			// Apply the selected enclosure
			if (tag) {
				if (tagEnclosure === "parentheses") {
					tag = `(${tag})`;
				} else if (tagEnclosure === "brackets") {
					tag = `[${tag}]`;
				}
			} else {
				vscode.window.showErrorMessage(
					"Unable to determine tag for the current file."
				);
				return;
			}

			// Find the repository for the current file
			const repo = gitApi.repositories.find((r) =>
				filePath.startsWith(r.rootUri.fsPath)
			);
			if (!repo) {
				vscode.window.showErrorMessage(
					"No Git repository found for the current file."
				);
				return;
			}

			// Insert the tag into the commit message input box
			const currentMessage = repo.inputBox.value;

			// Avoid duplicating the tag
			if (!currentMessage.startsWith(tag)) {
				repo.inputBox.value = `${tag} ${currentMessage}`;
			}

			// Show Source Control view
			vscode.commands.executeCommand("workbench.view.scm");
		}
	);

	context.subscriptions.push(disposableCommand);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
