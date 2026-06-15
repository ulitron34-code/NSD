import os
import re

src_dir = r"F:\CODEX\ulitron34-code-nsd-https-github-com\src"
spanish_words = {'de', 'el', 'la', 'en', 'que', 'un', 'una', 'los', 'las', 'para', 'con', 'por', 'su', 'al', 'como', 'mas', 'del', 'otorgante', 'solicitante', 'expediente', 'ronda', 'traccion', 'piloto', 'biometricos', 'gobierno', 'trazabilidad', 'comision', 'riesgo', 'seguro', 'comite'}

# Load runtime translations
runtime_copy_path = r"F:\CODEX\ulitron34-code-nsd-https-github-com\src\utils\runtimeCopy.js"
with open(runtime_copy_path, "r", encoding="utf-8") as f:
    runtime_content = f.read()

# Simple regex to extract keys in RUNTIME_TRANSLATIONS dictionary
match_dict = re.search(r"export const RUNTIME_TRANSLATIONS = \{(.*?)\};", runtime_content, re.DOTALL)
keys_in_dict = set()
if match_dict:
    dict_content = match_dict.group(1)
    keys = re.findall(r'"([^"]+)"\s*:', dict_content)
    for k in keys:
        keys_in_dict.add(k.strip())
    keys_single = re.findall(r"'([^']+)'\s*:", dict_content)
    for k in keys_single:
        keys_in_dict.add(k.strip())

untranslated_hardcoded = []

def looks_like_spanish_text(text):
    text_clean = text.strip()
    if len(text_clean) < 3:
        return False
    # Avoid css values/styles
    if any(text_clean.startswith(x) for x in ['#', 'rgba', 'linear-gradient', 'clamp', 'minmax', '1px', 'repeat', 'solid']):
        return False
    words = re.findall(r'\b[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+\b', text_clean.lower())
    has_accents = any(c in 'áéíóúüñÁÉÍÓÚÜÑ' for c in text_clean)
    has_spanish_vocab = any(w in spanish_words for w in words)
    return has_accents or has_spanish_vocab

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, src_dir)
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            for line_idx, line in enumerate(lines):
                # Look for hardcoded JSX text or strings that are not using L() or copy() or translateCopy()
                # Find all string literals in the line
                # "..." or '...' or `...`
                strings = re.findall(r'"([^"\n]{2,})"', line)
                strings += re.findall(r"'([^'\n]{2,})'", line)
                strings += re.findall(r"`([^`\n]{2,})`", line)
                
                # Check for plain text outside tags in JSX lines
                # E.g. >Texto en español<
                jsx_text = re.findall(r'>([^<>{}\n]+)<', line)
                strings += jsx_text
                
                for s in strings:
                    s_clean = s.strip()
                    if looks_like_spanish_text(s_clean):
                        # Is it translated in the file using a translate function?
                        # If the line contains L("s_clean" or L('s_clean' or copy("s_clean" or copy('s_clean' or translateCopy("s_clean"
                        # then it's translated!
                        pattern_l = r'L\(\s*[\'"]' + re.escape(s_clean) + r'[\'"]'
                        pattern_copy = r'copy\(\s*[\'"]' + re.escape(s_clean) + r'[\'"]'
                        pattern_trans = r'translateCopy\(\s*[\'"]' + re.escape(s_clean) + r'[\'"]'
                        
                        is_wrapped = re.search(pattern_l, line) or re.search(pattern_copy, line) or re.search(pattern_trans, line)
                        
                        if not is_wrapped:
                            untranslated_hardcoded.append((rel_path, line_idx + 1, s_clean, line.strip()))

# Write to a file with utf-8 encoding
out_path = r"F:\CODEX\ulitron34-code-nsd-https-github-com\scratch\hardcoded_spanish_lines.txt"
with open(out_path, "w", encoding="utf-8") as out_f:
    out_f.write(f"Found {len(untranslated_hardcoded)} lines with potential untranslated hardcoded Spanish:\n")
    for path, line_no, text, line_content in untranslated_hardcoded:
        out_f.write(f"{path}:{line_no} -> {text} | Context: {line_content}\n")
print(f"Audit completed. Found {len(untranslated_hardcoded)} items. Results written to scratch/hardcoded_spanish_lines.txt")
