#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { Command } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();

program
  .name("license-edit")
  .description("Bulk edit names and years in GitHub license files")
  .version("1.0.0")
  .option("-t, --token <token>", "GitHub Personal Access Token")
  .option("-o, --org <org>", "GitHub organization name (optional)")
  .option("--old-year <year>", "The year to be replaced")
  .option("--new-year <year>", "The new year")
  .option("--old-name <name>", "The name to be replaced")
  .option("--new-name <name>", "The new name")
  .option("--dry-run", "Show what would be changed without making actual changes")
  .parse(process.argv);

const options = program.opts();

const token = options.token || process.env.GITHUB_TOKEN;

if (!token) {
  console.error(chalk.red("Error: GitHub token is required. Use -t or set GITHUB_TOKEN env var."));
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

async function getRepositories() {
  let repos = [];
  try {
    if (options.org) {
      repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
        org: options.org,
        type: "all",
      });
    } else {
      repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
        visibility: "all",
      });
    }
  } catch (error) {
    console.error(chalk.red(`Error fetching repositories: ${error.message}`));
    process.exit(1);
  }
  return repos;
}

async function updateLicense(repo) {
  const { owner, name: repoName } = repo;
  const possibleLicenseFiles = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "license.md", "license.txt"];

  let licenseFile = null;
  let content = null;
  let sha = null;

  for (const file of possibleLicenseFiles) {
    try {
      const response = await octokit.rest.repos.getContent({
        owner: owner.login,
        repo: repoName,
        path: file,
      });

      if (response.data && !Array.isArray(response.data)) {
        licenseFile = file;
        content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        sha = response.data.sha;
        break;
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
  }

  if (!licenseFile) {
    console.log(chalk.yellow(`No license file found in ${owner.login}/${repoName}`));
    return;
  }

  let newContent = content;
  let changed = false;

  if (options.oldYear && options.newYear) {
    const yearRegex = new RegExp(options.oldYear, 'g');
    if (yearRegex.test(newContent)) {
      newContent = newContent.replace(yearRegex, options.newYear);
      changed = true;
    }
  }

  if (options.oldName && options.newName) {
    const nameRegex = new RegExp(options.oldName, 'g');
    if (nameRegex.test(newContent)) {
      newContent = newContent.replace(nameRegex, options.newName);
      changed = true;
    }
  }

  if (changed) {
    if (options.dryRun) {
      console.log(chalk.blue(`[DRY RUN] Would update license in ${owner.login}/${repoName}`));
    } else {
      try {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: owner.login,
          repo: repoName,
          path: licenseFile,
          message: "docs: update license year/name",
          content: Buffer.from(newContent).toString('base64'),
          sha: sha,
        });
        console.log(chalk.green(`Updated license in ${owner.login}/${repoName}`));
      } catch (error) {
        console.error(chalk.red(`Error updating license in ${owner.login}/${repoName}: ${error.message}`));
      }
    }
  } else {
    console.log(chalk.gray(`No changes needed for ${owner.login}/${repoName}`));
  }
}

async function main() {
  console.log(chalk.cyan("Fetching repositories..."));
  const repos = await getRepositories();
  console.log(chalk.cyan(`Found ${repos.length} repositories.`));

  for (const repo of repos) {
    await updateLicense(repo);
  }

  console.log(chalk.bold.green("\nDone!"));
}

main();
