/**
 * Standard placeholders used in license templates.
 */
export const PLACEHOLDERS = [
  '[year]',
  '[fullname]',
  '<year>',
  '<copyright holders>',
  '<owner>',
  '[yyyy]',
  '[name of copyright owner]'
];

/**
 * Normalizes text for comparison by collapsing whitespace and converting to lowercase.
 */
function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Replaces placeholders or specific text in a license content.
 */
export function replaceLogic(content, options) {
  let newContent = content;
  let changed = false;
  let message = "docs: update license year/name";

  if (options.selectedLicense || options.licenseTemplateBody) {
    if (!options.licenseTemplateBody) {
       return { newContent, changed, message, error: "License template body is missing." };
    }
    newContent = options.licenseTemplateBody;

    let yearReplaced = false;
    let nameReplaced = false;

    if (options.newYear) {
      if (newContent.includes('[year]')) {
          newContent = newContent.replace(/\[year\]/g, options.newYear);
          yearReplaced = true;
      }
    }

    if (options.newName) {
      if (newContent.includes('[fullname]')) {
          newContent = newContent.replace(/\[fullname\]/g, options.newName);
          nameReplaced = true;
      }
    }

    const remaining = PLACEHOLDERS.filter(p => newContent.includes(p));

    changed = normalize(newContent) !== normalize(content);
    message = `docs: update license to ${options.selectedLicense || 'custom'}`;

    return { newContent, changed, message, remainingPlaceholders: remaining };
  } else {
    if (options.oldYear && options.newYear) {
      const yearRegex = new RegExp(options.oldYear, 'g');
      if (yearRegex.test(newContent)) {
        newContent = newContent.replace(yearRegex, options.newYear);
      }
    }

    if (options.oldName && options.newName) {
      const nameRegex = new RegExp(options.oldName, 'g');
      if (nameRegex.test(newContent)) {
        newContent = newContent.replace(nameRegex, options.newName);
      }
    }

    changed = normalize(newContent) !== normalize(content);
    return { newContent, changed, message };
  }
}

/**
 * Checks if the content matches the template body, accounting for standard placeholders.
 */
export function checkLicenseIntegrity(content, templateBody) {
  if (!content || !templateBody) return "unknown";

  const normalizedContent = normalize(content);
  const normalizedTemplate = normalize(templateBody);

  const sortedPlaceholders = [...PLACEHOLDERS].sort((a, b) => b.length - a.length);

  let lastIndex = 0;
  let contentPos = 0;
  let matches = [];

  sortedPlaceholders.forEach(p => {
    let index = -1;
    const lowerP = p.toLowerCase();
    while ((index = normalizedTemplate.indexOf(lowerP, index + 1)) !== -1) {
      matches.push({index, length: p.length});
    }
  });
  matches.sort((a, b) => a.index - b.index);

  let filteredMatches = [];
  let lastEnd = -1;
  matches.forEach(m => {
    if (m.index >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.index + m.length;
    }
  });

  let suspectValues = [];
  for (let i = 0; i < filteredMatches.length; i++) {
    const m = filteredMatches[i];
    const anchor = normalizedTemplate.substring(lastIndex, m.index);

    if (anchor.length > 0) {
      const foundIndex = normalizedContent.indexOf(anchor, contentPos);
      if (foundIndex === -1) return "modified";

      if (i > 0) {
          const gap = normalizedContent.substring(contentPos, foundIndex);
          if (gap.length > 100) return "modified";
          suspectValues.push(gap);
      } else {
          if (foundIndex !== 0) return "modified";
      }
      contentPos = foundIndex + anchor.length;
    }
    lastIndex = m.index + m.length;
  }

  const finalAnchor = normalizedTemplate.substring(lastIndex);
  if (finalAnchor.length > 0) {
    const foundIndex = normalizedContent.indexOf(finalAnchor, contentPos);
    if (foundIndex === -1) return "modified";
    const gap = normalizedContent.substring(contentPos, foundIndex);
    if (gap.length > 100) return "modified";
    suspectValues.push(gap);

    if (foundIndex + finalAnchor.length < normalizedContent.length) {
        const remaining = normalizedContent.substring(foundIndex + finalAnchor.length);
        if (remaining.trim().length > 0) return "modified";
    }
  }

  // Final sanity check on suspect values (placeholders)
  // They shouldn't contain common words that are NOT in the template but look like license text
  const licenseWords = ["modified", "version", "special", "note", "added", "changed"];
  for (const val of suspectValues) {
      for (const word of licenseWords) {
          if (val.includes(word)) return "modified";
      }
  }

  return "standard";
}
