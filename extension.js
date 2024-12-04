const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

function activate(context) {
	// Command to insert tag into commit message
	const disposableInsertTag = vscode.commands.registerCommand(
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

			// Load configuration from tagger-config.json if available
			let config = vscode.workspace.getConfiguration("monorepo-tagger");
			let folderTagMap = config.get("folderTagMap", {});
			let excludeFolders = config.get("excludeFolders", []);
			let tagEnclosure = config.get("tagEnclosure", "parentheses");

			const configFilePath = path.join(
				workspaceFolder.uri.fsPath,
				"tagger-config.json"
			);

			if (fs.existsSync(configFilePath)) {
				try {
					const configFileContent = fs.readFileSync(
						configFilePath,
						"utf8"
					);
					const fileConfig = JSON.parse(configFileContent);

					// Override settings with config from file
					folderTagMap = fileConfig.folderTagMap || folderTagMap;
					excludeFolders =
						fileConfig.excludeFolders || excludeFolders;
					tagEnclosure = fileConfig.tagEnclosure || tagEnclosure;
				} catch (error) {
					vscode.window.showErrorMessage(
						"Error reading tagger-config.json: " + error.message
					);
					return;
				}
			}

			// Continue with tag generation
			const relativePath = path.relative(
				workspaceFolder.uri.fsPath,
				filePath
			);
			const pathSegments = relativePath.split(path.sep);
			const folderName = pathSegments.length > 1 ? pathSegments[0] : null;

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
			const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\u200d]+/u;
			const emojiMatch = currentMessage.match(emojiRegex);
			if (!currentMessage.startsWith(tag)) {
				// Insert after gitmojis
				if (emojiMatch) {
					repo.inputBox.value = `${
						emojiMatch[0]
					} ${tag} ${currentMessage.slice(emojiMatch[0].length)}`;
				} else {
					repo.inputBox.value = `${tag} ${currentMessage}`;
				}
			}

			// Show Source Control view
			vscode.commands.executeCommand("workbench.view.scm");
		}
	);

	// Command to create tagger-config.json file
	const disposableCreateConfig = vscode.commands.registerCommand(
		"monorepo-tagger.createConfig",
		async () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				vscode.window.showErrorMessage("No workspace folder is open.");
				return;
			}
			const workspaceFolder = workspaceFolders[0];
			const configFilePath = path.join(
				workspaceFolder.uri.fsPath,
				"tagger-config.json"
			);

			if (fs.existsSync(configFilePath)) {
				const overwrite = await vscode.window.showWarningMessage(
					"tagger-config.json already exists. Overwrite?",
					{ modal: true },
					"Yes",
					"No"
				);
				if (overwrite !== "Yes") {
					return;
				}
			}

			const defaultConfig = {
				folderTagMap: {},
				excludeFolders: [],
				tagEnclosure: "parentheses",
			};

			try {
				fs.writeFileSync(
					configFilePath,
					JSON.stringify(defaultConfig, null, 2),
					"utf8"
				);
				const document = await vscode.workspace.openTextDocument(
					configFilePath
				);
				await vscode.window.showTextDocument(document);
				vscode.window.showInformationMessage(
					"tagger-config.json has been created."
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					"Failed to create tagger-config.json: " + error.message
				);
			}
		}
	);

	context.subscriptions.push(disposableInsertTag);
	context.subscriptions.push(disposableCreateConfig);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
