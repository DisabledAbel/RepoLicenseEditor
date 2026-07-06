#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { Command } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import * as jsdiff from "diff";
import { replaceLogic, checkLicenseIntegrity } from "./logic.js";

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
  .option("--verify", "Verify license integrity without making changes")
  .option("--compare-with <license>", "Compare current license of repos with a given template")
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

async function getRepoLicenseContent(repo) {
  const { owner, name: repoName } = repo;
  const possibleLicenseFiles = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "license.md", "license.txt"];

  for (const file of possibleLicenseFiles) {
    try {
      const response = await octokit.rest.repos.getContent({
        owner: owner.login,
        repo: repoName,
        path: file,
      });

      if (response.data && !Array.isArray(response.data)) {
        return {
          content: Buffer.from(response.data.content, 'base64').toString('utf-8'),
          path: file,
          sha: response.data.sha
        };
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
  }
  return null;
}

async function updateLicense(repo, licenseTemplateBody = null) {
  const { owner, name: repoName } = repo;
  const licenseData = await getRepoLicenseContent(repo);
  let licenseFile = licenseData ? licenseData.path : null;
  const content = licenseData ? licenseData.content : null;
  const sha = licenseData ? licenseData.sha : null;

  if (options.compareWith && licenseTemplateBody) {
    if (!content) {
      console.log(chalk.yellow(`${owner.login}/${repoName}: No license file found to compare.`));
    } else {
      console.log(chalk.cyan(`\nComparing ${owner.login}/${repoName} with ${options.compareWith}:`));
      const diff = jsdiff.diffLines(content, licenseTemplateBody);
      diff.forEach((part) => {
        const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray;
        process.stdout.write(color(part.value));
      });
      console.log("\n" + chalk.cyan("-".repeat(40)));
    }
    return;
  }

  if (options.verify) {
    if (licenseFile && repo.license && repo.license.key) {
      try {
        const templateResp = await octokit.rest.licenses.get({ license: repo.license.key });
        const status = checkLicenseIntegrity(content, templateResp.data.body);
        const color = status === 'standard' ? chalk.green : (status === 'modified' ? chalk.red : chalk.yellow);
        console.log(`${owner.login}/${repoName}: License Integrity Status -> ${color(status.toUpperCase())}`);
      } catch (e) {
        console.log(`${owner.login}/${repoName}: Error checking integrity: ${e.message}`);
      }
    } else {
      console.log(`${owner.login}/${repoName}: No license file or license type detected, skipping integrity check.`);
    }
    return;
  }

  if (licenseTemplateBody) {
    if (repo.license) {
      if (options.customLicense) {
        console.log(chalk.yellow(`Warning: Repository ${repoName} already has a license (${repo.license.name}). Overwriting with custom template.`));
      } else if (repo.license.key !== options.license) {
        console.log(chalk.yellow(`Warning: Repository ${repoName} already has a different license (${repo.license.name}).`));
      }
    }
    if (!licenseFile) {
        licenseFile = "LICENSE";
    }
  } else if (!licenseFile) {
    console.log(chalk.yellow(`No license file found in ${owner.login}/${repoName}`));
    return;
  }

  const { newContent, changed, message, remainingPlaceholders } = replaceLogic(content || "", {
      ...options,
      selectedLicense: options.license,
      licenseTemplateBody
  });

  if (remainingPlaceholders && remainingPlaceholders.length > 0) {
      console.log(chalk.yellow(`Warning: [${owner.login}/${repoName}] Unreplaced placeholders: ${remainingPlaceholders.join(', ')}`));
  }

  if (changed) {
    try {
      const payload = {
        owner: owner.login,
        repo: repoName,
        path: licenseFile,
        message: message,
        content: Buffer.from(newContent).toString('base64'),
      };
      if (sha) payload.sha = sha;

      await octokit.rest.repos.createOrUpdateFileContents(payload);
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

  let licenseTemplateBody = null;
  let compareLicense = options.compareWith || options.license;
  if (compareLicense || options.customLicense) {
      try {
          if (options.customLicense) {
              if (!fs.existsSync(options.customLicense)) {
                  console.error(chalk.red(`Error: Custom license file not found at ${options.customLicense}`));
                  process.exit(1);
              }
              licenseTemplateBody = fs.readFileSync(options.customLicense, "utf-8");
          } else {
              const { data: licenseTemplate } = await octokit.rest.licenses.get({ license: compareLicense });
              licenseTemplateBody = licenseTemplate.body;
          }
      } catch (error) {
          console.error(chalk.red(`Error fetching/reading license template: ${error.message}`));
          process.exit(1);
      }
  }

  for (const repo of repos) {
    try {
      await updateLicense(repo, licenseTemplateBody);
    } catch (error) {
      console.error(chalk.red(`Error processing repository ${repo.name}: ${error.message}`));
    }
  }

  console.log(chalk.bold.green("\nDone!"));
}

main();
