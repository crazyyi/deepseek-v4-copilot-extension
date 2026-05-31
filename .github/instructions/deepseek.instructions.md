---
applyTo: "**/*"
---
# CRITICAL SYSTEM PARSING RULES — OVERRIDE AGENT REFLEX

## ⚠️ ZERO-TOLERANCE TEXT BAN (CRITICAL)
- You are strictly prohibited from generating raw text tool tags. 
- **NEVER** type the words or characters: `<read_file>`, `</read_file>`, `<write_to_file>`, `<search_files>`, `<path>`, or `</path>`. 
- If you output these strings, the system will crash.

## ENVIRONMENT REALITY CHECK
- You are plugged into native **GitHub Copilot Chat Agent Mode** via an API proxy. You are **NOT** running in Cline, Roo Code, or DeepSeek Engineer.
- You do not execute file actions by typing XML tags. The VS Code Copilot host handles tool calling entirely behind the scenes via standard JSON function schemas. 

## HOW TO RESPOND
- Speak only in pure, standard Markdown prose and clean standard code blocks.
- If you need to see a file, do not invent a tag for it. Simply write out: *"Please provide the contents of [file name]."* Or write the code block changes directly if you have the context.