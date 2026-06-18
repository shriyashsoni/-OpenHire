import os
import re
import sys
import json
import shutil
import subprocess
import argparse
from pathlib import Path

def extract_from_html(html_content):
    data = {}
    
    # Try to find company name from title
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
    if title_match:
        # Often titles are like "Home | CompanyName" or "CompanyName - Tagline"
        title_text = title_match.group(1).strip()
        parts = re.split(r'\||-', title_text)
        if len(parts) > 1:
            data['company_name'] = parts[-1].strip()
        else:
            data['company_name'] = title_text
            
    # Try to find tagline from meta description
    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', html_content, re.IGNORECASE)
    if desc_match:
        data['company_tagline'] = desc_match.group(1).strip()
        
    # Try to find contact email
    email_match = re.search(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', html_content)
    if email_match:
        data['contact_email'] = email_match.group(1)
        
    return data

def extract_from_package_json(pkg_content):
    data = {}
    try:
        pkg = json.loads(pkg_content)
        if 'name' in pkg:
            # clean up npm package name (e.g. @scope/my-app -> My App)
            name = pkg['name'].split('/')[-1].replace('-', ' ').title()
            data['company_name'] = name
        if 'description' in pkg:
            data['company_tagline'] = pkg['description']
        if 'homepage' in pkg:
            data['website_url'] = pkg['homepage']
    except Exception:
        pass
    return data

def find_primary_color(css_content):
    # Very basic heuristic: find the first hex color that isn't black/white/gray
    hex_colors = re.findall(r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b', css_content)
    for h in hex_colors:
        h = h.lower()
        if len(h) == 3:
            h = h[0]*2 + h[1]*2 + h[2]*2
        
        # skip whites and blacks/grays
        if h not in ('ffffff', '000000', 'eeeeee', 'dddddd', 'cccccc', '333333', '111111', '222222'):
            return f"#{h}"
    return None

def analyze_repository(repo_path):
    print(f"[*] Analyzing repository at {repo_path}...")
    repo_path = Path(repo_path)
    
    extracted = {
        'company_name': 'My Company',
        'company_tagline': 'Join our team to build great things.',
        'website_url': 'https://example.com',
        'primary_color': '#5d3c98',
        'contact_email': 'hello@example.com',
        'logo_path': None
    }
    
    # 1. Check package.json
    pkg_path = repo_path / 'package.json'
    if pkg_path.exists():
        pkg_data = extract_from_package_json(pkg_path.read_text('utf-8'))
        extracted.update(pkg_data)
        
    # 2. Check index.html (in root or public/ or src/)
    html_files = list(repo_path.glob('index.html')) + list(repo_path.glob('public/index.html')) + list(repo_path.glob('src/index.html'))
    if html_files:
        html_data = extract_from_html(html_files[0].read_text('utf-8'))
        # Only override if we actually found something
        for k, v in html_data.items():
            if v: extracted[k] = v
            
    # 3. Find primary color from CSS
    css_files = list(repo_path.glob('**/*.css'))
    for css_file in css_files[:5]: # limit to first 5
        try:
            color = find_primary_color(css_file.read_text('utf-8'))
            if color:
                extracted['primary_color'] = color
                break
        except Exception:
            pass
            
    # 4. Find Logo
    # Look for files named logo.png, logo.svg, icon.png
    logo_files = list(repo_path.glob('**/logo.png')) + list(repo_path.glob('**/logo.svg')) + list(repo_path.glob('**/icon.png'))
    if logo_files:
        extracted['logo_path'] = logo_files[0]
        
    return extracted

def main():
    parser = argparse.ArgumentParser(description="Auto Brand Pipeline for OpenHire")
    parser.add_argument("repo_path", help="Path to the user's main website repository")
    parser.add_argument("--output-dir", default="my-career-page", help="Output directory for the generated career page")
    
    args = parser.parse_args()
    
    if not os.path.isdir(args.repo_path):
        print(f"[-] Error: {args.repo_path} is not a valid directory.")
        sys.exit(1)
        
    data = analyze_repository(args.repo_path)
    
    print("\n[*] Extraction Complete! Found the following branding:")
    print(f"  - Company Name:  {data['company_name']}")
    print(f"  - Tagline:       {data['company_tagline']}")
    print(f"  - Website URL:   {data['website_url']}")
    print(f"  - Primary Color: {data['primary_color']}")
    print(f"  - Contact Email: {data['contact_email']}")
    if data['logo_path']:
        print(f"  - Logo Found:    {data['logo_path']}")
        
    print("\n[*] Running OpenHire CLI...")
    
    cli_path = Path(__file__).parent / 'cli.js'
    
    cmd = [
        "node", str(cli_path),
        args.output_dir,
        "--company-name", data['company_name'],
        "--company-tagline", data['company_tagline'],
        "--website-url", data['website_url'],
        "--primary-color", data['primary_color'],
        "--contact-email", data['contact_email']
    ]
    
    # Run the CLI
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError:
        print("[-] CLI setup failed.")
        sys.exit(1)
        
    # Copy logo if found
    if data['logo_path']:
        print("\n[*] Copying extracted logo to the new project...")
        out_path = Path(args.output_dir)
        logo_ext = data['logo_path'].suffix
        
        # Replace the appropriate logo file in public and root if they exist
        dest_files = [
            out_path / f"logo{logo_ext}",
            out_path / "public" / f"logo{logo_ext}"
        ]
        
        for dest in dest_files:
            if dest.parent.exists():
                shutil.copy(data['logo_path'], dest)
                print(f"  -> Copied to {dest}")
                
    print(f"\n[+] Professional Pipeline Complete! Your customized career page is ready at ./{args.output_dir}")

if __name__ == "__main__":
    main()
