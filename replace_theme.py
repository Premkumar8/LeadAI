import os
import re

directories = [r"d:\LeadAI SaaS\frontend\src", r"d:\LeadAI SaaS\backend"]

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Text replacements
    content = content.replace("Avanta", "Swamy Jewellery")
    content = content.replace("AVANTA", "SWAMY JEWELLERY")
    content = content.replace("avanta.ai", "swamyjewellery.com")
    content = content.replace("John Doe", "Swamy Jewellery")
    
    # Color replacements to amber (golden)
    content = re.sub(r'\bcyan-(\d+)', r'amber-\1', content)
    content = re.sub(r'\bteal-(\d+)', r'amber-\1', content)
    content = re.sub(r'\bblue-(\d+)', r'amber-\1', content)
    
    # We might also want to replace bg-cyan, text-cyan etc. 
    # The regex above \bcyan-(\d+) handles `text-cyan-500`, `bg-cyan-500` perfectly!

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.py'):
                replace_in_file(os.path.join(root, file))
