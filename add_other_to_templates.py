#!/usr/bin/env python3
"""
Script to add "Other" option to all missing select fields in RFQ template JSON
"""

import json
import sys
from pathlib import Path

def add_other_to_templates(json_path):
    """Add 'Other' to all select fields that don't have it"""
    
    # Read the JSON file
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    count_updated = 0
    count_skipped = 0
    
    # Iterate through all major categories
    for category in data.get('majorCategories', []):
        category_name = category.get('label', 'Unknown')
        
        # Iterate through all job types
        for job_type in category.get('jobTypes', []):
            # Iterate through all fields
            for field in job_type.get('fields', []):
                # Check if this is a select field
                if field.get('type') == 'select':
                    options = field.get('options', [])
                    
                    # Check if "Other" is already there
                    if options and "Other" not in options:
                        # Add "Other" at the end
                        field['options'].append("Other")
                        count_updated += 1
                        print(f"✅ Updated: {category_name} → {field['name']} (now has {len(options)+1} options)")
                    else:
                        count_skipped += 1
                        if options and "Other" in options:
                            print(f"⏭️  Skipped:  {category_name} → {field['name']} (already has 'Other')")
    
    # Write the updated JSON back
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')  # Add trailing newline
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Updated: {count_updated} fields")
    print(f"  Skipped: {count_skipped} fields")
    print(f"  Total:   {count_updated + count_skipped} select fields processed")
    print(f"{'='*60}")
    
    return count_updated

if __name__ == '__main__':
    json_path = Path('/Users/macbookpro2/Desktop/zintra-platform/public/data/rfq-templates-v2-hierarchical.json')
    
    if not json_path.exists():
        print(f"Error: File not found at {json_path}")
        sys.exit(1)
    
    print(f"Processing: {json_path}\n")
    updated = add_other_to_templates(json_path)
    
    if updated > 0:
        print(f"\n✅ Successfully updated {updated} fields with 'Other' option")
    else:
        print(f"\n⏭️  No fields needed updating")
