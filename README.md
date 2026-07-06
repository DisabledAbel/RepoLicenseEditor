# GitHub License Bulk Editor

A CLI tool to bulk edit names and years in license files across all your GitHub repositories (or those within an organization).

## Features

- Scans all repositories accessible by the provided GitHub PAT.
- Supports both personal accounts and organizations.
- Identifies common license file names (`LICENSE`, `LICENSE.md`, etc.).
- Replaces year and/or name using regex.
- Includes a dry-run mode to preview changes.

## Installation

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
