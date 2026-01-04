import sqlite3
import argparse
import yaml
import os
import glob
from typing import Dict, List, Optional

# Custom YAML Dumper that uses literal style for multiline strings
class LiteralDumper(yaml.Dumper):
    pass

def literal_str_representer(dumper, data):
    """Use literal block style (|) for multi-line strings."""
    if '\n' in data or '\r' in data:
        # Normalize line endings to \n
        data = data.replace('\r\n', '\n').replace('\r', '\n')
        # Force literal style, no matter what special characters exist
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_str(data)

# Register the custom representer with our custom dumper
LiteralDumper.add_representer(str, literal_str_representer)

def get_next_sequence_filename() -> str:
    """Find the next available sequence filename.
    Returns: sequenceN.yaml where N is the count of existing files + 1
    """
    # Find all sequence*.yaml files
    pattern = 'sequence*.yaml'
    existing_files = glob.glob(pattern)
    
    if not existing_files:
        # No files exist yet, start with sequence1.yaml
        return 'sequence1.yaml'
    
    # Count the files
    count = len(existing_files)
    return f'sequence{count + 1}.yaml'

def get_sequence_by_id(db_path: str, sequence_id: int) -> Optional[Dict]:
    """Get sequence data by ID.
    Returns: dict with sequence data or None if not found
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title, description FROM sequences WHERE id = ?", (sequence_id,))
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        return None
    
    sequence_data = {
        'id': result[0],
        'title': result[1],
        'description': result[2]
    }
    
    conn.close()
    return sequence_data

def get_sequence_by_title(db_path: str, title: str) -> Optional[Dict]:
    """Get sequence data by title.
    Returns: dict with sequence data or None if not found
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title, description FROM sequences WHERE title = ?", (title,))
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        return None
    
    sequence_data = {
        'id': result[0],
        'title': result[1],
        'description': result[2]
    }
    
    conn.close()
    return sequence_data

def list_sequences(db_path: str) -> List[Dict]:
    """List all sequences in the database.
    Returns: list of dicts with id and title
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title FROM sequences ORDER BY id")
    results = cursor.fetchall()
    conn.close()
    
    return [{'id': row[0], 'title': row[1]} for row in results]

def get_steps_for_sequence(db_path: str, sequence_id: int) -> List[Dict]:
    """Get all steps for a sequence.
    Returns: list of step dicts with id, title, description
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, title, description FROM steps WHERE sequence_id = ? ORDER BY id",
        (sequence_id,)
    )
    results = cursor.fetchall()
    conn.close()
    
    return [
        {
            'id': row[0],
            'title': row[1],
            'description': row[2]
        }
        for row in results
    ]

def get_brainparts_for_step(db_path: str, step_id: int) -> List[str]:
    """Get all brainpart titles for a step.
    Returns: list of brainpart titles
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT b.title 
        FROM brainparts b
        JOIN step_brainparts sb ON b.id = sb.brainpart_id
        WHERE sb.step_id = ?
        ORDER BY b.title
    """, (step_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    return [row[0] for row in results]

def export_sequence_to_yaml(db_path: str, sequence_id: int, output_file: str):
    """Export a sequence from database to YAML file."""
    
    # Get sequence data
    sequence_data = get_sequence_by_id(db_path, sequence_id)
    if not sequence_data:
        print(f"ERROR: Sequence with ID {sequence_id} not found in database")
        return
    
    print(f"Exporting sequence: {sequence_data['title']}")
    
    # Get steps
    steps = get_steps_for_sequence(db_path, sequence_id)
    print(f"Found {len(steps)} steps")
    
    # Build YAML structure
    yaml_data = {
        'sequence': {
            'id': f'sequence_{sequence_id}',  # Generate a simple id
            'title': sequence_data['title'],
            'description': sequence_data['description'] or '',
            'steps': []
        }
    }
    
    # Add steps with brainparts
    for idx, step in enumerate(steps, 1):
        print(f"  [{idx}/{len(steps)}] Exporting step: {step['title']}")
        
        brainparts = get_brainparts_for_step(db_path, step['id'])
        brainparts_str = ', '.join(brainparts) if brainparts else ''
        
        if brainparts:
            print(f"    Found {len(brainparts)} brainparts")
        
        step_data = {
            'id': f'step_{step["id"]}',  # Generate a simple id
            'title': step['title'],
            'description': step['description'] or '',
            'step_brainparts': brainparts_str
        }
        
        yaml_data['sequence']['steps'].append(step_data)
    
    # Write to YAML file
    print(f"\nWriting to file: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_data, f, Dumper=LiteralDumper, default_flow_style=False, 
                  allow_unicode=True, sort_keys=False, width=float("inf"))
    
    # Post-process the file to fix description formatting
    print("Post-processing YAML format...")
    with open(output_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace quoted descriptions with literal block style
    # Pattern: description: "..." with newlines inside
    import re
    
    # Find all description fields with quoted multiline content
    def replace_description(match):
        full_match = match.group(0)
        indentation = match.group(1)
        quoted_content = match.group(2)
        
        # Unescape the content: replace \\n with actual newlines, \\r with nothing
        unescaped = quoted_content.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\\r', '\n')
        
        # Remove trailing/leading whitespace on each line and re-indent
        lines = unescaped.split('\n')
        formatted_lines = '\n'.join(f'{indentation}  {line}' if line.strip() else '' for line in lines)
        
        return f'{indentation}description: |\n{formatted_lines}'
    
    # Match description: "content with \n inside" 
    pattern = r'^(\s+)description: "((?:[^"\\]|\\.)*)"\s*$'
    content = re.sub(pattern, replace_description, content, flags=re.MULTILINE)
    
    # Write back the fixed content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("="*60)
    print("✓ Sequence export completed successfully!")
    print(f"Output file: {output_file}")
    print(f"Sequence: {sequence_data['title']}")
    print(f"Steps exported: {len(steps)}")
    print("="*60)

def main():
    parser = argparse.ArgumentParser(description='Export sequence from database to YAML file')
    parser.add_argument(
        '--db',
        default='data/app.db',
        help='Database file path (default: data/app.db)'
    )
    parser.add_argument(
        '--output',
        help='Output YAML file (default: sequenceN.yaml, where N is auto-incremented)'
    )
    parser.add_argument(
        '--id',
        type=int,
        help='Sequence ID to export'
    )
    parser.add_argument(
        '--title',
        help='Sequence title to export (alternative to --id)'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='List all sequences in the database'
    )
    
    args = parser.parse_args()
    
    # Check if database exists
    if not os.path.exists(args.db):
        print(f"ERROR: Database file not found: {args.db}")
        return
    
    # List sequences if requested
    if args.list:
        sequences = list_sequences(args.db)
        if not sequences:
            print("No sequences found in database")
            return
        
        print(f"Found {len(sequences)} sequence(s) in database:")
        print("-" * 60)
        for seq in sequences:
            print(f"ID: {seq['id']:3d}  Title: {seq['title']}")
        print("-" * 60)
        return
    
    # Determine which sequence to export
    sequence_id = None
    
    if args.id:
        sequence_id = args.id
    elif args.title:
        sequence_data = get_sequence_by_title(args.db, args.title)
        if not sequence_data:
            print(f"ERROR: No sequence found with title: {args.title}")
            print("\nAvailable sequences:")
            sequences = list_sequences(args.db)
            for seq in sequences:
                print(f"  ID: {seq['id']:3d}  Title: {seq['title']}")
            return
        sequence_id = sequence_data['id']
    else:
        # No ID or title specified, list sequences and ask user
        sequences = list_sequences(args.db)
        if not sequences:
            print("ERROR: No sequences found in database")
            return
        
        if len(sequences) == 1:
            print(f"Found 1 sequence in database: {sequences[0]['title']}")
            sequence_id = sequences[0]['id']
        else:
            print(f"Found {len(sequences)} sequences in database:")
            print("-" * 60)
            for seq in sequences:
                print(f"ID: {seq['id']:3d}  Title: {seq['title']}")
            print("-" * 60)
            
            while True:
                try:
                    response = input("\nEnter the ID of the sequence to export: ").strip()
                    sequence_id = int(response)
                    if any(s['id'] == sequence_id for s in sequences):
                        break
                    print(f"ERROR: No sequence with ID {sequence_id}")
                except ValueError:
                    print("ERROR: Please enter a valid number")
                except KeyboardInterrupt:
                    print("\nOperation cancelled.")
                    return
    
    # Determine output filename
    output_file = args.output
    if not output_file:
        output_file = get_next_sequence_filename()
        print(f"Using auto-generated filename: {output_file}")
    
    # Check if output file exists
    if os.path.exists(output_file):
        response = input(f"\nWARNING: File '{output_file}' already exists. Overwrite? (y/n): ").lower()
        if response != 'y':
            print("Operation cancelled.")
            return
    
    # Export the sequence
    export_sequence_to_yaml(args.db, sequence_id, output_file)

if __name__ == "__main__":
    main()
