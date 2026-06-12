import os
import re

# Load all translation keys from runtimeCopy.js
runtime_copy_path = r"F:\CODEX\ulitron34-code-nsd-https-github-com\src\utils\runtimeCopy.js"
with open(runtime_copy_path, "r", encoding="utf-8") as f:
    runtime_content = f.read()

# Simple regex to extract keys in RUNTIME_TRANSLATIONS dictionary
# Matches: "key": "value", or 'key': 'value',
# Let's search inside the RUNTIME_TRANSLATIONS block
match_dict = re.search(r"export const RUNTIME_TRANSLATIONS = \{(.*?)\};", runtime_content, re.DOTALL)
keys_in_dict = set()
if match_dict:
    dict_content = match_dict.group(1)
    # Match double quoted keys: "key":
    keys = re.findall(r'"([^"]+)"\s*:', dict_content)
    for k in keys:
        keys_in_dict.add(k.strip())
    # Match single quoted keys if any
    keys_single = re.findall(r"'([^']+)'\s*:", dict_content)
    for k in keys_single:
        keys_in_dict.add(k.strip())

print(f"Loaded {len(keys_in_dict)} keys from runtimeCopy.js")

target_files = [
    "CompetitiveMoatTab.jsx",
    "DueDiligenceRoomTab.jsx",
    "FundraisingRoomTab.jsx",
    "GovernanceDisclosureTab.jsx",
    "ImplementationRoadmapTab.jsx",
    "InvestorOnePagerTab.jsx",
    "InvestorPitchTab.jsx",
    "InvestorQATab.jsx",
    "PilotPlaybookTab.jsx",
    "PitchDemoModeTab.jsx",
    "PredeployGoNoGoTab.jsx",
    "TractionPilotsTab.jsx",
]

dashboard_dir = r"F:\CODEX\ulitron34-code-nsd-https-github-com\src\components\Dashboard"

# We want to find strings that are in Spanish in these files and check if they are in the dictionary
# Spanish strings usually contain Spanish-specific characters or are words that are not in English.
# But we can also look at every string literal in JSX files and print it if it looks like Spanish or is simply not in the dictionary.
# Let's write a simple scanner for strings inside quotes: double, single, and template literals.

def is_spanish(text):
    # If the text has Spanish common words or accents, or is simply not in English, we consider it Spanish.
    # Common Spanish words: de, el, la, en, y, que, un, una, los, las, para, con, por, su, al, es, como, mas, o, se, del
    spanish_words = {'de', 'el', 'la', 'en', 'que', 'un', 'una', 'los', 'las', 'para', 'con', 'por', 'su', 'al', 'es', 'como', 'mas', 'del', 'otorgante', 'solicitante', 'expediente', 'ronda', 'traccion', 'piloto', 'biometricos', 'gobierno', 'trazabilidad', 'comision', 'riesgo', 'seguro', 'comite'}
    words = re.findall(r'\b[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+\b', text.lower())
    # Check if there are any Spanish accents or if any word is in the spanish_words set
    has_accents = any(c in 'áéíóúüñÁÉÍÓÚÜÑ' for c in text)
    has_spanish_vocab = any(w in spanish_words for w in words)
    return has_accents or has_spanish_vocab

missing_translations = []

for filename in target_files:
    file_path = os.path.join(dashboard_dir, filename)
    if not os.path.exists(file_path):
        print(f"File not found: {filename}")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Let's extract all strings in the file.
    # We can match:
    # 1. Double quoted strings: "..."
    # 2. Single quoted strings: '...'
    # 3. Template literals: `...`
    # (Avoid imports/requires/attributes like styles and classNames if they are short)
    strings = re.findall(r'"([^"\n]{2,})"', content)
    strings += re.findall(r"'([^'\n]{2,})'", content)
    strings += re.findall(r"`([^`]{2,})`", content)
    
    seen = set()
    for s in strings:
        s_clean = s.strip()
        if not s_clean or s_clean in seen:
            continue
        seen.add(s_clean)
        
        # Check if it looks like a UI text (has spaces or matches Spanish indicators)
        if len(s_clean) > 2 and (is_spanish(s_clean) or any(w in s_clean.lower() for w in ['completar', 'revisar', 'pendiente', 'aprobado'])):
            if s_clean not in keys_in_dict:
                # Let's double check if it is already translated or contains translations
                # Let's add to missing list
                missing_translations.append((filename, s_clean))

# Sort by filename and print
missing_translations.sort()
print(f"\nFound {len(missing_translations)} potential missing translations:")
for fn, s in missing_translations:
    print(f"[{fn}] -> {s}")

# Write missing translations to a text file for easy copy-paste
output_file = r"F:\CODEX\ulitron34-code-nsd-https-github-com\scratch\missing_keys.txt"
with open(output_file, "w", encoding="utf-8") as out:
    for fn, s in missing_translations:
        out.write(f"File: {fn}\nKey: {s}\n\n")
