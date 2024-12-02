# Monorepo Tagger

**Monorepo Tagger** is a Visual Studio Code extension that prepends a tag to your Git commit messages based on the highest-level folder in your project (relative to the workspace root). This is especially useful in monorepo setups where you want to categorize commits by the part of the project they affect.

## Features

-   **Automatic Tagging**: Automatically adds a tag to your commit messages based on the folder you're working in.
-   **Custom Folder-to-Tag Mapping**: Define custom tags for specific folders using the `folderTagMap` setting.
-   **Exclude Folders from Tagging**: Specify folders to exclude from tagging using the `excludeFolders` setting.
-   **Tag Enclosure Options**: Choose whether to enclose tags in parentheses `()` or brackets `[]` using the `tagEnclosure` setting.
-   **Integration with Git Source Control**: Pre-fills the commit message in the Git Source Control view, allowing you to review and edit before committing.

## Requirements

-   Visual Studio Code version **1.95.0** or higher.
-   Git must be installed and accessible from the command line.

## Extension Settings

This extension contributes the following settings:

-   `monorepo-tagger.folderTagMap`: An object mapping folder names to custom tags. If a folder is not listed, its name will be used as the tag by default.

    ```json
    // Example in settings.json
    "monorepo-tagger.folderTagMap": {
      "transcription-method": "asr",
      "analytics": "analytics-tag"
    }
    ```

-   `monorepo-tagger.excludeFolders`: An array of folder names to exclude from tagging.

```json
// Example in settings.json
"monorepo-tagger.excludeFolders": [
  "common-utils",
  "scripts"
]
```

-   `monorepo-tagger.tagEnclosure`: Choose whether to enclose tags in parentheses `()` or brackets `[]`

```json
// Example in settings.json
"monorepo-tagger.tagEnclosure": "brackets" // Options: "parentheses", "brackets"
```
