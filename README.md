# GitHub License Bulk Editor

A CLI tool to bulk edit names and years in license files across all your GitHub repositories (or those within an organization).

## Features

- **CLI & Web Interface**: Use it from your terminal or directly in your browser.
- **Bulk Processing**: Scans all repositories accessible by the provided GitHub PAT.
- **Org Support**: Supports both personal accounts and organizations.
- **Smart Discovery**: Identifies common license file names (`LICENSE`, `LICENSE.md`, etc.).
- **Flexible Editing**: Replaces year and/or name using regex.
- **Safety First**: Includes a dry-run mode to preview changes.

## Browser Usage

You can use the editor directly in your browser by opening the `index.html` file. No installation is required for the browser version as it uses Octokit from a CDN.

1. Open `index.html` in any modern web browser.
2. Enter your GitHub Personal Access Token.
3. Fill in the fields you want to update.
4. Click "Start Bulk Edit".
5. View the progress in the activity log.

## CLI Usage

```bash
npm install
```

## Usage

You need a GitHub Personal Access Token (PAT) with `repo` scope.

### Basic Example

Update the year from 2023 to 2024 in all your repositories:

```bash
node index.js --token YOUR_GITHUB_TOKEN --old-year 2023 --new-year 2024
```

### Update Name and Year

```bash
node index.js -t YOUR_GITHUB_TOKEN --old-year 2023 --new-year 2024 --old-name "John Doe" --new-name "Jane Smith"
```

### Run for an Organization

```bash
node index.js -t YOUR_GITHUB_TOKEN -o your-org --old-year 2023 --new-year 2024
```

### Dry Run

Preview changes without actually committing them to GitHub:

```bash
node index.js -t YOUR_GITHUB_TOKEN --old-year 2023 --new-year 2024 --dry-run
```

### Environment Variables

You can also set your token as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
node index.js --old-year 2023 --new-year 2024
```

Or use a `.env` file:

```text
GITHUB_TOKEN=your_token_here
```

## License

ISC
