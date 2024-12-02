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

			const workspaceFolder = vscode.workspace.getWorkspaceFolder(
				vscode.Uri.file(filePath)
			);

			if (!workspaceFolder) {
				vscode.window.showErrorMessage(
					"File is not within any workspace folder."
				);
				return;
			}

			// Get the relative path from the workspace root to the file
			const relativePath = path.relative(
				workspaceFolder.uri.fsPath,
				filePath
			);
			const pathSegments = relativePath.split(path.sep);

			// The highest-level folder is the first segment of the relative path
			const folderName = pathSegments.length > 1 ? pathSegments[0] : null;

			const config = vscode.workspace.getConfiguration("monorepo-tagger");
			const folderTagMap = config.get("folderTagMap", {});
			const excludeFolders = config.get("excludeFolders", []);
			const tagEnclosure = config.get("tagEnclosure", "parentheses");

			if (folderName && excludeFolders.includes(folderName)) {
				// Proceed without a tag
				// Show Source Control view
				vscode.commands.executeCommand("workbench.view.scm");
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
			}

			// Access the SCM input box
			const gitExtension = vscode.extensions.getExtension("vscode.git");
			if (!gitExtension) {
				vscode.window.showErrorMessage("Git extension not found.");
				return;
			}

			const gitApi = gitExtension.exports.getAPI(1);
			const repo = gitApi.repositories.find((r) =>
				filePath.startsWith(r.rootUri.fsPath)
			);
			if (!repo) {
				vscode.window.showErrorMessage(
					"No Git repository found for the current file."
				);
				return;
			}

			// Set the commit message
			repo.inputBox.value = `${tag} `;

			// Show Source Control view
			vscode.commands.executeCommand("workbench.view.scm");
		}
	);

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
