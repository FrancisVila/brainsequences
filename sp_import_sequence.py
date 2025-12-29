import sqlite3
import argparse
import yaml
from typing import List, Dict, Optional, Tuple

def read_yaml_file(filename: str) -> Dict:
    """Read and parse the YAML file."""
    with open(filename, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data

def get_existing_sequence(db_path: str, title: str) -> Optional[Tuple[int, List[Dict]]]:
    """Check if a sequence with the given title exists.
    Returns: (sequence_id, steps) or None if not found
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM sequences WHERE title = ?", (title,))
    result = cursor.fetchone()
    
    if result:
        sequence_id = result[0]
        # Get existing steps
        cursor.execute("SELECT id, title FROM steps WHERE sequence_id = ? ORDER BY id", (sequence_id,))
        steps = [{'id': row[0], 'title': row[1]} for row in cursor.fetchall()]
        conn.close()
        return sequence_id, steps
    
    conn.close()
    return None

def get_brainpart_ids(db_path: str) -> Tuple[Dict[str, int], Dict[str, str]]:
    """Get all brainpart titles and their IDs.
    Returns: (dict mapping title to id, dict mapping lowercase title to actual title)
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM brainparts")
    rows = cursor.fetchall()
    conn.close()
    
    brainparts = {row[1]: row[0] for row in rows}
    lowercase_map = {row[1].lower(): row[1] for row in rows}
    return brainparts, lowercase_map

def delete_sequence_steps(db_path: str, sequence_id: int):
    """Delete all steps for a sequence (cascade will handle step_brainparts)."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM steps WHERE sequence_id = ?", (sequence_id,))
    conn.commit()
    conn.close()

def create_sequence(db_path: str, title: str, description: str) -> int:
    """Create a new sequence and return its ID."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sequences (title, description) VALUES (?, ?)",
        (title, description)
    )
    conn.commit()
    sequence_id = cursor.lastrowid
    conn.close()
    return sequence_id

def update_sequence(db_path: str, sequence_id: int, description: str):
    """Update an existing sequence's description."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE sequences SET description = ? WHERE id = ?",
        (description, sequence_id)
    )
    conn.commit()
    conn.close()

def create_step(db_path: str, sequence_id: int, title: str, description: str) -> int:
    """Create a new step and return its ID."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO steps (sequence_id, title, description) VALUES (?, ?, ?)",
        (sequence_id, title, description)
    )
    conn.commit()
    step_id = cursor.lastrowid
    conn.close()
    return step_id

def create_step_brainpart(db_path: str, step_id: int, brainpart_id: int):
    """Create a step_brainpart relationship."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO step_brainparts (step_id, brainpart_id) VALUES (?, ?)",
            (step_id, brainpart_id)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        # Relationship already exists
        pass
    conn.close()

def main():
    parser = argparse.ArgumentParser(description='Import sequence from YAML file to database')
    parser.add_argument(
        '--file',
        default='sequence.yaml',
        help='Input YAML file (default: sequence.yaml)'
    )
    parser.add_argument(
        '--db',
        default='data/app.db',
        help='Database file path (default: data/app.db)'
    )
    args = parser.parse_args()
    
    print(f"Reading YAML file: {args.file}")
    data = read_yaml_file(args.file)
    
    sequence_data = data.get('sequence', {})
    title = sequence_data.get('title', '')
    description = sequence_data.get('description', '')
    steps_data = sequence_data.get('steps', [])
    
    if not title:
        print("ERROR: No title found in YAML file")
        return
    
    print(f"\nSequence title: {title}")
    print(f"Number of steps: {len(steps_data)}")
    
    # Get all brainparts
    brainparts, lowercase_map = get_brainpart_ids(args.db)
    print(f"Found {len(brainparts)} brainparts in database")
    
    # Check for missing brainparts
    missing_brainparts = set()
    for step in steps_data:
        step_brainparts = step.get('step_brainparts', '')
        if step_brainparts:
            brainpart_names = [bp.strip() for bp in step_brainparts.split(',')]
            for bp_name in brainpart_names:
                if bp_name and bp_name.lower() not in lowercase_map:
                    missing_brainparts.add(bp_name)
    
    if missing_brainparts:
        print(f"\n⚠ WARNING: The following brainparts mentioned in the YAML file do not exist in the database:")
        for bp in sorted(missing_brainparts):
            print(f"  - {bp}")
        response = input("\nDo you want to continue anyway? (y/n): ").lower()
        if response != 'y':
            print("Operation cancelled.")
            return
    
    # Check if sequence exists
    existing = get_existing_sequence(args.db, title)
    
    sequence_id = None
    if existing:
        existing_id, existing_steps = existing
        print(f"\n⚠ A sequence with the title '{title}' already exists, with steps:")
        for step in existing_steps:
            print(f"  - {step['title']}")
        
        print("\nDo you want to:")
        print("  1. Override it (delete old steps and create new ones)")
        print("  2. Keep the old one and create a new one")
        print("  3. Cancel")
        
        while True:
            response = input("Enter your choice (1/2/3) [default: 1]: ").strip() or "1"
            if response in ['1', '2', '3']:
                break
            print("Please enter 1, 2, or 3")
        
        if response == '3':
            print("Operation cancelled.")
            return
        elif response == '1':
            # Override: delete existing steps and update sequence
            print(f"\nOverriding sequence {existing_id}...")
            delete_sequence_steps(args.db, existing_id)
            update_sequence(args.db, existing_id, description)
            sequence_id = existing_id
        else:  # response == '2'
            # Create new sequence
            print("\nCreating new sequence...")
            sequence_id = create_sequence(args.db, title, description)
    else:
        # Create new sequence
        print("\nCreating new sequence...")
        sequence_id = create_sequence(args.db, title, description)
    
    print(f"Sequence ID: {sequence_id}")
    
    # Create steps
    print(f"\nCreating {len(steps_data)} steps...")
    for idx, step_data in enumerate(steps_data, 1):
        step_title = step_data.get('title', '')
        step_description = step_data.get('description', '')
        step_brainparts_str = step_data.get('step_brainparts', '')
        
        print(f"\n[{idx}/{len(steps_data)}] Creating step: {step_title}")
        step_id = create_step(args.db, sequence_id, step_title, step_description)
        print(f"  Step ID: {step_id}")
        
        # Create step_brainpart relationships
        if step_brainparts_str:
            brainpart_names = [bp.strip() for bp in step_brainparts_str.split(',')]
            print(f"  Linking {len(brainpart_names)} brainparts...")
            for bp_name in brainpart_names:
                if bp_name.lower() in lowercase_map:
                    # Use the actual database title (with correct capitalization)
                    actual_title = lowercase_map[bp_name.lower()]
                    brainpart_id = brainparts[actual_title]
                    create_step_brainpart(args.db, step_id, brainpart_id)
                    print(f"    ✓ Linked to brainpart: {actual_title} (ID: {brainpart_id})")
                elif bp_name:
                    print(f"    ⚠ Skipped missing brainpart: {bp_name}")
    
    print("\n" + "="*60)
    print("✓ Sequence import completed successfully!")
    print(f"Sequence ID: {sequence_id}")
    print(f"Title: {title}")
    print(f"Steps created: {len(steps_data)}")
    print("="*60)

if __name__ == "__main__":
    main()
