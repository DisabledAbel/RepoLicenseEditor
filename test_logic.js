import { replaceLogic } from "./logic.js";

const testContent = `
Copyright (c) 2023 John Doe
All rights reserved.
`;

console.log("Test 1: Replace Year");
const res1 = replaceLogic(testContent, { oldYear: "2023", newYear: "2024" });
console.log(res1);
if (res1.newContent.includes("2024") && res1.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 2: Replace Name");
const res2 = replaceLogic(testContent, { oldName: "John Doe", newName: "Jane Smith" });
console.log(res2);
if (res2.newContent.includes("Jane Smith") && res2.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 3: Replace Both");
const res3 = replaceLogic(testContent, { oldYear: "2023", newYear: "2024", oldName: "John Doe", newName: "Jane Smith" });
console.log(res3);
if (res3.newContent.includes("2024") && res3.newContent.includes("Jane Smith") && res3.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 4: No Match");
const res4 = replaceLogic(testContent, { oldYear: "2022", newYear: "2024", oldName: "Unknown", newName: "Jane Smith" });
console.log(res4);
if (res4.newContent === testContent.toLowerCase().replace(/\s+/g, ' ').trim() || res4.newContent === testContent) {
    if (!res4.changed) console.log("PASS"); else console.log("FAIL");
} else {
    console.log("FAIL: unexpected content change");
}

console.log("\nTest 5: License Template Replacement");
const mitTemplate = "MIT License\n\nCopyright (c) [year] [fullname]\n\nPermission...";
const res5 = replaceLogic(testContent, { newYear: "2025", newName: "New Author", selectedLicense: "mit", licenseTemplateBody: mitTemplate });
console.log(res5);
if (res5.newContent.includes("2025") && res5.newContent.includes("New Author") && !res5.newContent.includes("[year]") && res5.changed && res5.message.includes("mit")) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 6: Apache-style Placeholders");
const apacheTemplate = "Apache License 2.0\n\nCopyright <year> <copyright holders>\n\n...";
const res6 = replaceLogic(testContent, { newYear: "2026", newName: "Apache Author", selectedLicense: "apache-2.0", licenseTemplateBody: apacheTemplate });
console.log(res6);
if (res6.newContent.includes("2026") && res6.newContent.includes("Apache Author") && !res6.newContent.includes("<year>") && res6.changed) console.log("PASS"); else console.log("FAIL");

console.log("\nTest 7: Other Placeholder Variations");
const otherTemplate = "License\n\nCopyright [yyyy] [name of copyright owner]\n\n...";
const res7 = replaceLogic(testContent, { newYear: "2027", newName: "Owner Name", selectedLicense: "custom", licenseTemplateBody: otherTemplate });
console.log(res7);
if (res7.newContent.includes("2027") && res7.newContent.includes("Owner Name") && !res7.newContent.includes("[yyyy]") && res7.changed) console.log("PASS"); else console.log("FAIL");
