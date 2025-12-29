import sqlite3
import argparse
import requests
from typing import List, Tuple, Optional, Dict
import time
from datetime import datetime

def read_svg_ids(filename: str) -> List[str]:
    """Read SVG IDs from file."""
    with open(filename, 'r') as f:
        return [line.strip() for line in f if line.strip()]

def get_existing_brainparts(db_path: str) -> Dict[str, Dict]:
    """Get all existing brainpart IDs with their details from database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Check if wikipedia_url column exists
    cursor.execute("PRAGMA table_info(brainparts)")
    columns = [col[1] for col in cursor.fetchall()]
    has_wikipedia_url = 'wikipedia_url' in columns
    
    if has_wikipedia_url:
        cursor.execute("SELECT id, title, description, wikipedia_url FROM brainparts")
        existing = {row[0]: {'title': row[1], 'description': row[2], 'wikipedia_url': row[3]} for row in cursor.fetchall()}
    else:
        cursor.execute("SELECT id, title, description FROM brainparts")
        existing = {row[0]: {'title': row[1], 'description': row[2], 'wikipedia_url': None} for row in cursor.fetchall()}
    conn.close()
    return existing

def search_wikipedia(term: str) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Search Wikipedia for a term.
    Returns: (exact_match, title, description, url)
    """
    # Clean the term for Wikipedia search
    search_term = term.replace('_', ' ').replace('-', ' ')
    # Capitalize first letter of each word for better Wikipedia matching
    search_term_capitalized = search_term.title()
    
    # Set User-Agent header as required by Wikipedia API policy
    headers = {
        'User-Agent': 'BrainSequences/1.0 (Python script for educational brain anatomy project)'
    }
    
    # Try exact match first with capitalized version
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{search_term_capitalized}"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            page_type = data.get('type')
            # Accept standard pages and disambiguation pages
            if page_type in ['standard', 'disambiguation']:
                title = data.get('title')
                description = data.get('extract', '')
                # Construct Wikipedia URL from title
                wiki_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}" if title else ''
                # For disambiguation pages, note it in the description
                if page_type == 'disambiguation':
                    description = f"[DISAMBIGUATION PAGE] {description}"
                return True, title, description, wiki_url
            else:
                print(f"  → Page type '{page_type}' not recognized for {term}")
        elif response.status_code == 404:
            print(f"  → No exact Wikipedia page found for '{search_term}'")
        else:
            print(f"  → Wikipedia API returned status {response.status_code} for {term}")
    except requests.exceptions.RequestException as e:
        print(f"  → Network error fetching exact match for {term}: {e}")
    except Exception as e:
        print(f"  → Error processing exact match for {term}: {e}")
    
    # Try search API for approximate matches
    search_url = "https://en.wikipedia.org/w/api.php"
    params = {
        'action': 'opensearch',
        'search': search_term_capitalized,
        'limit': 5,
        'namespace': 0,
        'format': 'json'
    }
    
    try:
        response = requests.get(search_url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if len(data) > 1 and data[1]:  # Has results
                # Return first result as approximate match
                title = data[1][0]
                # Get description for the first result
                desc_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
                desc_response = requests.get(desc_url, headers=headers, timeout=10)
                if desc_response.status_code == 200:
                    desc_data = desc_response.json()
                    # Construct Wikipedia URL from title
                    wiki_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                    return False, title, desc_data.get('extract', ''), wiki_url
    except requests.exceptions.RequestException as e:
        print(f"  → Network error searching for {term}: {e}")
    except Exception as e:
        print(f"  → Error processing search for {term}: {e}")
    
    return False, None, None, None

def create_brainpart(db_path: str, title: str, description: str, wikipedia_url: Optional[str] = None) -> Tuple[bool, Optional[int]]:
    """Create a new brainpart entry in the database.
    Returns: (success, new_id)
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        # Check if wikipedia_url column exists
        cursor.execute("PRAGMA table_info(brainparts)")
        columns = [col[1] for col in cursor.fetchall()]
        has_wikipedia_url = 'wikipedia_url' in columns
        
        if has_wikipedia_url:
            cursor.execute(
                "INSERT INTO brainparts (title, description, wikipedia_url) VALUES (?, ?, ?)",
                (title, description, wikipedia_url)
            )
        else:
            # If column doesn't exist, try to add it
            try:
                cursor.execute("ALTER TABLE brainparts ADD COLUMN wikipedia_url TEXT")
                conn.commit()
                cursor.execute(
                    "INSERT INTO brainparts (title, description, wikipedia_url) VALUES (?, ?, ?)",
                    (title, description, wikipedia_url)
                )
            except sqlite3.OperationalError:
                # Column already exists or can't be added, insert without it
                cursor.execute(
                    "INSERT INTO brainparts (title, description) VALUES (?, ?)",
                    (title, description)
                )
        
        conn.commit()
        new_id = cursor.lastrowid
        print(f"✓ Created brainpart: {title}")
        if wikipedia_url:
            print(f"  → Wikipedia URL: {wikipedia_url}")
        conn.close()
        return True, new_id
    except sqlite3.IntegrityError:
        print(f"⚠ Brainpart {title} already exists")
        conn.close()
        return False, None
    except Exception as e:
        print(f"✗ Error creating brainpart {title}: {e}")
        conn.close()
        return False, None

def generate_report(report_data: Dict, report_filename: str):
    """Generate a detailed report of database changes."""
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("BRAINPARTS DATABASE CHANGE REPORT\n")
        f.write("="*80 + "\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Database: {report_data['db_path']}\n")
        f.write(f"Input file: {report_data['input_file']}\n")
        f.write("\n")
        
        # Summary section
        f.write("="*80 + "\n")
        f.write("SUMMARY\n")
        f.write("="*80 + "\n")
        f.write(f"Total SVG IDs in input file: {report_data['total_svg_ids']}\n")
        f.write(f"Existing brainparts (before): {report_data['existing_before']}\n")
        f.write(f"Existing brainparts (after): {report_data['existing_after']}\n")
        f.write(f"Brainparts added: {report_data['added_count']}\n")
        f.write(f"Brainparts modified: {report_data['modified_count']}\n")
        f.write(f"Brainparts deleted: {report_data['deleted_count']}\n")
        f.write(f"Items not created: {report_data['not_created_count']}\n")
        f.write("\n")
        
        # Added brainparts section
        f.write("="*80 + "\n")
        f.write("ADDED BRAINPARTS\n")
        f.write("="*80 + "\n")
        if report_data['added']:
            for item in report_data['added']:
                f.write(f"\nID: {item['id']}\n")
                f.write(f"SVG ID: {item['svg_id']}\n")
                f.write(f"Title: {item['title']}\n")
                f.write(f"Match Type: {item['match_type']}\n")                
                if item.get('wikipedia_url'):
                    f.write(f"Wikipedia URL: {item['wikipedia_url']}\n")                
                f.write(f"Description: {item['description'][:200]}...\n" if len(item['description']) > 200 else f"Description: {item['description']}\n")
                f.write("-"*80 + "\n")
        else:
            f.write("No brainparts were added.\n")
        f.write("\n")
        
        # Modified brainparts section
        f.write("="*80 + "\n")
        f.write("MODIFIED BRAINPARTS\n")
        f.write("="*80 + "\n")
        if report_data['modified']:
            for item in report_data['modified']:
                f.write(f"\nID: {item['id']}\n")
                f.write(f"Field: {item['field']}\n")
                f.write(f"Old Value: {item['old_value']}\n")
                f.write(f"New Value: {item['new_value']}\n")
                f.write("-"*80 + "\n")
        else:
            f.write("No brainparts were modified.\n")
        f.write("\n")
        
        # Deleted brainparts section
        f.write("="*80 + "\n")
        f.write("DELETED BRAINPARTS\n")
        f.write("="*80 + "\n")
        if report_data['deleted']:
            for item in report_data['deleted']:
                f.write(f"\nID: {item['id']}\n")
                f.write(f"Title: {item['title']}\n")
                f.write(f"Description: {item['description'][:200]}...\n" if len(item['description']) > 200 else f"Description: {item['description']}\n")
                f.write("-"*80 + "\n")
        else:
            f.write("No brainparts were deleted.\n")
        f.write("\n")
        
        # Not created section
        f.write("="*80 + "\n")
        f.write("ITEMS NOT CREATED\n")
        f.write("="*80 + "\n")
        if report_data['not_created']:
            for item in report_data['not_created']:
                f.write(f"\nSVG ID: {item['svg_id']}\n")
                f.write(f"Reason: {item['reason']}\n")
                if item.get('suggested_match'):
                    f.write(f"Suggested Match: {item['suggested_match']}\n")
                f.write("-"*80 + "\n")
        else:
            f.write("All items from input file were successfully created.\n")
        f.write("\n")
        
        f.write("="*80 + "\n")
        f.write("END OF REPORT\n")
        f.write("="*80 + "\n")

def main():
    parser = argparse.ArgumentParser(description='Check and create brainparts from Wikipedia')
    parser.add_argument(
        '--file',
        default='svg_ids.txt',
        help='Input file containing SVG IDs (default: svg_ids.txt)'
    )
    parser.add_argument(
        '--db',
        default='data/app.db',
        help='Database file path (default: data/app.db)'
    )
    parser.add_argument(
        '--report',
        default='brainparts_change_report.txt',
        help='Output report file path (default: brainparts_change_report.txt)'
    )
    args = parser.parse_args()
    
    # Initialize report data structure
    report_data = {
        'db_path': args.db,
        'input_file': args.file,
        'total_svg_ids': 0,
        'existing_before': 0,
        'existing_after': 0,
        'added_count': 0,
        'modified_count': 0,
        'deleted_count': 0,
        'not_created_count': 0,
        'added': [],
        'modified': [],
        'deleted': [],
        'not_created': []
    }
    
    print(f"Reading SVG IDs from: {args.file}")
    svg_ids = read_svg_ids(args.file)
    report_data['total_svg_ids'] = len(svg_ids)
    print(f"Found {len(svg_ids)} SVG IDs")
    
    print(f"\nChecking existing brainparts in: {args.db}")
    existing_before = get_existing_brainparts(args.db)
    report_data['existing_before'] = len(existing_before)
    print(f"Found {len(existing_before)} existing brainparts")
    
    # Find missing IDs
    missing = [id for id in svg_ids if id not in existing_before]
    print(f"\nFound {len(missing)} missing brainparts")
    
    if not missing:
        print("All SVG IDs already have corresponding brainparts!")
        # Still generate report showing no changes
        report_data['existing_after'] = len(existing_before)
        generate_report(report_data, args.report)
        print(f"\nReport generated: {args.report}")
        return
    
    created_exact = []
    created_approximate = []
    not_found = []
    skip_all = False
    
    print("\nSearching Wikipedia for missing brainparts...")
    for idx, svg_id in enumerate(missing, 1):
        if skip_all:
            # If user chose to skip all, add remaining to not_created
            report_data['not_created'].append({
                'svg_id': svg_id,
                'reason': 'User skipped all remaining approximate matches',
                'suggested_match': None
            })
            continue
            
        print(f"\n[{idx}/{len(missing)}] Checking: {svg_id}")
        
        exact_match, title, description, wiki_url = search_wikipedia(svg_id)
        
        if exact_match:
            print(f"  → Found EXACT match: {title}")
            print(f"  → {description[:100]}...")
            success, new_id = create_brainpart(args.db, title, description, wiki_url)
            if success:
                created_exact.append((svg_id, title))
                report_data['added'].append({
                    'id': new_id,
                    'svg_id': svg_id,
                    'title': title,
                    'match_type': 'EXACT',
                    'description': description,
                    'wikipedia_url': wiki_url
                })
            else:
                report_data['not_created'].append({
                    'svg_id': svg_id,
                    'reason': 'Database error or duplicate title',
                    'suggested_match': title
                })
        elif title:
            print(f"  → Found APPROXIMATE match: {title}")
            print(f"  → {description[:100] if description else 'No description'}...")
            
            while True:
                response = input(f"  → Create brainpart for '{svg_id}' using '{title}'? (y/n/s=skip all): ").lower()
                if response == 'y':
                    success, new_id = create_brainpart(args.db, title, description or '', wiki_url)
                    if success:
                        created_approximate.append((svg_id, title))
                        report_data['added'].append({
                            'id': new_id,
                            'svg_id': svg_id,
                            'title': title,
                            'match_type': 'APPROXIMATE (User Confirmed)',
                            'description': description or '',
                            'wikipedia_url': wiki_url
                        })
                    else:
                        report_data['not_created'].append({
                            'svg_id': svg_id,
                            'reason': 'Database error or duplicate title',
                            'suggested_match': title
                        })
                    break
                elif response == 'n':
                    print("  → Skipped")
                    not_found.append(svg_id)
                    report_data['not_created'].append({
                        'svg_id': svg_id,
                        'reason': 'User rejected approximate match',
                        'suggested_match': title
                    })
                    break
                elif response == 's':
                    print("  → Skipping all remaining approximate matches")
                    not_found.append(svg_id)
                    report_data['not_created'].append({
                        'svg_id': svg_id,
                        'reason': 'User skipped this approximate match',
                        'suggested_match': title
                    })
                    skip_all = True
                    break
                else:
                    print("  → Please enter 'y', 'n', or 's'")
            
            if skip_all:
                continue
        else:
            print(f"  → No Wikipedia match found")
            not_found.append(svg_id)
            report_data['not_created'].append({
                'svg_id': svg_id,
                'reason': 'No Wikipedia match found',
                'suggested_match': None
            })
        
        # Be nice to Wikipedia's API
        time.sleep(0.5)
    
    # Get final state of database
    existing_after = get_existing_brainparts(args.db)
    report_data['existing_after'] = len(existing_after)
    report_data['added_count'] = len(report_data['added'])
    report_data['not_created_count'] = len(report_data['not_created'])
    
    # Check for deleted items (items that were in database before but not after)
    deleted_ids = set(existing_before.keys()) - set(existing_after.keys())
    for del_id in deleted_ids:
        report_data['deleted'].append({
            'id': del_id,
            'title': existing_before[del_id]['title'],
            'description': existing_before[del_id]['description']
        })
    report_data['deleted_count'] = len(report_data['deleted'])
    
    # Print summary to console
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nExact matches created: {len(created_exact)}")
    for svg_id, title in created_exact:
        print(f"  - {svg_id} → {title}")
    
    print(f"\nApproximate matches created: {len(created_approximate)}")
    for svg_id, title in created_approximate:
        print(f"  - {svg_id} → {title}")
    
    print(f"\nNot found or skipped: {len(not_found)}")
    for svg_id in not_found:
        print(f"  - {svg_id}")
    
    # Generate detailed report file
    generate_report(report_data, args.report)
    print(f"\n{'='*60}")
    print(f"Detailed report generated: {args.report}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
