function replaceLogic(content, oldYear, newYear, oldName, newName, selectedLicense, licenseTemplateBody) {
  let newContent = content;
  let changed = false;
  let message = "docs: update license year/name";

  if (selectedLicense) {
    newContent = licenseTemplateBody;
    if (newYear) {
      newContent = newContent.replace(/\[year\]/g, newYear);
    }
    if (newName) {
      newContent = newContent.replace(/\[fullname\]/g, newName);
    }
    changed = true;
    message = `docs: update license to ${selectedLicense}`;
  } else {
    if (oldYear && newYear) {
      const yearRegex = new RegExp(oldYear, 'g');
      if (yearRegex.test(newContent)) {
        newContent = newContent.replace(yearRegex, newYear);
        changed = true;
      }
    }

    if (oldName && newName) {
      const nameRegex = new RegExp(oldName, 'g');
      if (nameRegex.test(newContent)) {
        newContent = newContent.replace(nameRegex, newName);
        changed = true;
      }
    }
  }

  return { newContent, changed, message };
}

const testContent = `
Copyright (c) 2023 John Doe
All rights reserved.
`;

console.log("Test 1: Replace Year");
const res1 = replaceLogic(testContent, "2023", "2024", null, null, null, null);
console.log(res1);
if (res1.newContent.includes("2024") && res1.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 2: Replace Name");
const res2 = replaceLogic(testContent, null, null, "John Doe", "Jane Smith", null, null);
console.log(res2);
if (res2.newContent.includes("Jane Smith") && res2.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 3: Replace Both");
const res3 = replaceLogic(testContent, "2023", "2024", "John Doe", "Jane Smith", null, null);
console.log(res3);
if (res3.newContent.includes("2024") && res3.newContent.includes("Jane Smith") && res3.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 4: No Match");
const res4 = replaceLogic(testContent, "2022", "2024", "Unknown", "Jane Smith", null, null);
console.log(res4);
if (res4.newContent === testContent && !res4.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 5: License Template Replacement");
const mitTemplate = "MIT License\n\nCopyright (c) [year] [fullname]\n\nPermission...";
const res5 = replaceLogic(testContent, null, "2025", null, "New Author", "mit", mitTemplate);
console.log(res5);
if (res5.newContent.includes("2025") && res5.newContent.includes("New Author") && !res5.newContent.includes("[year]") && res5.changed && res5.message.includes("mit")) console.log("PASS"); else console.log("FAIL");
