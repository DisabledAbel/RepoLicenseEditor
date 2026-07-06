#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { Command } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";

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
  .option("-l, --license <key>", "The license template to use (e.g., mit, apache-2.0)")
  .option("--custom-license <path>", "Path to a custom license template file")
  .option("-r, --repos <repos>", "Comma-separated list of repository names to process")
  .option("--min-stars <number>", "Filter repositories with at least this many stars", parseInt)
  .option("--branch <name>", "Filter repositories by default branch name")
  .option("--current-license <spdx_id>", "Filter repositories by their current license spdx_id")
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

  let newContent = content;
  let changed = false;
  let message = "docs: update license year/name";

  if (options.license || options.customLicense) {
    if (repo.license) {
      if (options.customLicense) {
        console.log(chalk.yellow(`Warning: Repository ${repoName} already has a license (${repo.license.name}). Overwriting with custom template.`));
      } else if (repo.license.key !== options.license) {
        console.log(chalk.yellow(`Warning: Repository ${repoName} already has a different license (${repo.license.name}).`));
      }
    }

    try {
      let templateBody = "";
      let licenseKey = options.license;

      if (options.customLicense) {
        if (!fs.existsSync(options.customLicense)) {
          console.error(chalk.red(`Error: Custom license file not found at ${options.customLicense}`));
          return;
        }
        templateBody = fs.readFileSync(options.customLicense, "utf-8");
        licenseKey = "custom";
      } else {
        const { data: licenseTemplate } = await octokit.rest.licenses.get({ license: options.license });
        templateBody = licenseTemplate.body;
      }

      newContent = templateBody;
      if (options.newYear) {
        newContent = newContent.replace(/\[year\]/g, options.newYear);
      }
      if (options.newName) {
        newContent = newContent.replace(/\[fullname\]/g, options.newName);
      }
      changed = true;
      message = `docs: update license to ${licenseKey}`;
      if (!licenseFile) {
        licenseFile = "LICENSE";
      }
    } catch (error) {
      console.error(chalk.red(`Error fetching/reading license template: ${error.message}`));
      return;
    }
  } else {
    if (!licenseFile) {
      console.log(chalk.yellow(`No license file found in ${owner.login}/${repoName}`));
      return;
    }

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
  }

  if (changed) {
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: owner.login,
        repo: repoName,
        path: licenseFile,
        message: message,
        content: Buffer.from(newContent).toString('base64'),
        sha: sha,
      });
      console.log(chalk.green(`Updated license in ${owner.login}/${repoName}`));
    } catch (error) {
      console.error(chalk.red(`Error updating license in ${owner.login}/${repoName}: ${error.message}`));
    }
  } else {
    console.log(chalk.gray(`No changes needed for ${owner.login}/${repoName}`));
  }
}

async function main() {
  console.log(chalk.cyan("Fetching repositories..."));
  let repos = await getRepositories();
  console.log(chalk.cyan(`Found ${repos.length} repositories.`));

  if (options.repos) {
    const targetRepos = options.repos.split(",").map(r => r.trim());
    repos = repos.filter(repo => targetRepos.includes(repo.name));
    console.log(chalk.cyan(`Filtered to ${repos.length} repositories based on --repos flag.`));
  }

  if (options.minStars !== undefined) {
    repos = repos.filter(repo => repo.stargazers_count >= options.minStars);
    console.log(chalk.cyan(`Filtered to ${repos.length} repositories with at least ${options.minStars} stars.`));
  }

  if (options.branch) {
    repos = repos.filter(repo => repo.default_branch === options.branch);
    console.log(chalk.cyan(`Filtered to ${repos.length} repositories with default branch ${options.branch}.`));
  }

  if (options.currentLicense) {
    repos = repos.filter(repo => repo.license && (repo.license.spdx_id === options.currentLicense || repo.license.key === options.currentLicense));
    console.log(chalk.cyan(`Filtered to ${repos.length} repositories with current license ${options.currentLicense}.`));
  }

  for (const repo of repos) {
    await updateLicense(repo);
  }

  console.log(chalk.bold.green("\nDone!"));
}

main();
