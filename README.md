# GitHub License Bulk Editor

A versatile tool to bulk edit names and years in license files across all your GitHub repositories or those within a specific organization. Available as both a **Command Line Interface (CLI)** and a **Web-based Interface**.

## 🚀 Features

- **Dual Mode**: Choose between a terminal-based CLI or a user-friendly browser interface.
- **Bulk Processing**: Automatically iterates through all repositories accessible by your GitHub Personal Access Token.
- **Organization Support**: Optionally target a specific GitHub organization.
- **Smart Discovery**: Automatically detects common license file names: `LICENSE`, `LICENSE.md`, `LICENSE.txt`, etc.
- **Advanced Filtering**: Filter repositories by name, stars, license, default branch, or size.
- **Sorting**: Sort repositories by name, stars, last updated, or size.
- **Regex Replacement**: Uses regular expressions for flexible and powerful text replacement.
- **Change License**: Switch between different license templates (MIT, Apache, etc.) or use a custom template.
- **License Detection**: Automatically detects existing licenses and warns if they differ from the intended change.
- **Integrity Check**: Verifies if the existing license text is a standard version of the declared license or if it has been modified.
- **UTF-8 Support**: Properly handles special characters in license files.

---

## 🛠 Prerequisites

To use this tool, you need a **GitHub Personal Access Token (PAT)**:

1. Go to your [GitHub Token Settings](https://github.com/settings/tokens).
2. Generate a new token (classic or fine-grained).
3. **Required Scopes**:
   - `repo` (Full control of private and public repositories).

---

## 🌐 Browser Usage

The browser-based version requires no installation and runs directly in your web browser.

1. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
2. Enter your **GitHub PAT**.
3. (Optional) Specify an **Organization** name.
4. Enter the **Old Year/Name** and the **New Year/Name**, or select a **License Template**.
5. Click **Start Bulk Edit** to apply changes.

---

## 💻 CLI Usage

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/DisabledAbel/RepoLicenseEditor.git
cd RepoLicenseEditor
npm install
```

### Authentication

You can provide your token via the `--token` flag, or set a `GITHUB_TOKEN` environment variable.

**Using a `.env` file:**
Create a `.env` file in the root directory:
```text
GITHUB_TOKEN=ghp_your_token_here
```

### Examples

**Update the year from 2023 to 2024:**
```bash
node index.js --old-year 2023 --new-year 2024
```

**Update both Name and Year for an Organization:**
```bash
node index.js --org my-org --old-year 2023 --new-year 2024 --old-name "Original Author" --new-name "New Author"
```

**Change the license to MIT and set the year/name:**
```bash
node index.js --license mit --new-year 2024 --new-name "Jane Smith"
```

### All CLI Options

| Option | Shorthand | Description |
|--------|-----------|-------------|
| `--token` | `-t` | GitHub Personal Access Token |
| `--org` | `-o` | GitHub organization name |
| `--old-year` | | The year to be replaced (for text replacement) |
| `--new-year` | | The new year |
| `--old-name` | | The name to be replaced (for text replacement) |
| `--new-name` | | The new name |
| `--license` | `-l` | The license template to use (e.g., mit, apache-2.0) |
| `--custom-license` | | Path to a custom license template file |
| `--min-stars` | | Filter repositories with at least this many stars |
| `--branch` | | Filter repositories by default branch name |
| `--current-license` | | Filter repositories by their current license spdx_id |
| `--verify` | | Verify license integrity without making changes |
| `--repos` | `-r` | Comma-separated list of repository names to process |
| `--help` | `-h` | Display help for command |

---

## 📝 License

This project is licensed under the [ISC License](LICENSE).
