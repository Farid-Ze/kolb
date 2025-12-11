---
description: Apply DaC standards to markdown documentation files
---

# Document As Code (DaC) Standards Workflow

This workflow applies DaC compliance standards to markdown documentation.

## DaC Compliance Checklist

For each document, ensure:

1. **YAML Front Matter** (lines 1-15)
   ```yaml
   ---
   document_id: [ID]
   title: [Document Title]
   version: "1.0"
   date: [YYYY-MM-DD]
   author: [Author Name]
   squad: [technical|design|strategy|synthesis]
   status: [draft|review|complete]
   dependencies:
     - [DEP-ID-1]
     - [DEP-ID-2]
   ---
   ```

2. **Table of Contents** (for docs with >3 sections)
   - Link each H2 heading
   - Use GitHub anchor format: `#-heading-text`

3. **Mermaid Diagrams** (replace ASCII art)
   - Use `mermaid` language identifier
   - Prefer flowcharts for hierarchies
   - Use sequence diagrams for flows

4. **Cross-Reference Links**
   - Use relative file paths: `[K3-02](specs/technical/kevin/BUILD-SYSTEM.md)`
   - Link to actual files, not just IDs

5. **Code Blocks**
   - Always specify language identifier
   - Use `typescript`, `css`, `html`, `yaml`, etc.

## Quality Checks

- [ ] Spelling and grammar correct
- [ ] No broken links
- [ ] Code examples have language tags
- [ ] Consistent terminology
- [ ] Accessibility: alt text for images

## Template Structure

```markdown
---
document_id: [ID]
title: [Title]
...
---

# [ID]: [Title]

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
...

---

## 📋 Document Header
...

## 🎯 Objective
...

## [Main Content Sections]
...

## ✅ Acceptance Criteria
...

## 🔗 Dependencies
...

## ✍️ Approval
...
```
