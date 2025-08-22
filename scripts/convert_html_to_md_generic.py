import os
import html2text
import re
import sys

# Initialize html2text converter
h = html2text.HTML2Text()
h.body_width = 0  # Disable line wrapping
h.single_line_break = False # Treat single line breaks as spaces, not newlines
h.ignore_links = False
h.ignore_images = False
h.bypass_tables = False
h.unicode_snob = True
h.skip_internal_links = True
h.inline_links = True

def convert_html_to_md(html_content):
    # Remove the outer <article> tag if present
    html_content = re.sub(r'^\s*<article[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</article>\s*$', '', html_content, flags=re.IGNORECASE)
    
    # Convert HTML to Markdown
    markdown_content = h.handle(html_content)
    
    # Clean up extra newlines that html2text might introduce
    markdown_content = re.sub(r'\n\s*\n\s*\n', '\n\n', markdown_content)
    
    # --- NEW AGGRESSIVE POST-PROCESSING FOR PARAGRAPH SPACING ---
    # This regex looks for a non-empty line followed by a non-empty line,
    # where the second line is not a heading or a list item.
    # It then inserts a blank line between them.
    
    # Pattern to match a line that is not a heading or list item, followed by a newline,
    # followed by another line that is not a heading or list item.
    # This is a complex regex, so I'll break it down:
    # (?!^#) : negative lookahead for start of line followed by # (not a heading)
    # (?!^- ) : negative lookahead for start of line followed by -  (not a list item)
    # (?!^\* ) : negative lookahead for start of line followed by *  (not a list item)
    # (?!^\d+\.\s) : negative lookahead for start of line followed by 1.  (not a numbered list item)
    # (?!^\s*$) : negative lookahead for start of line followed by whitespace and end of line (not a blank line)
    
    # This regex is difficult to get right perfectly for all cases.
    # A simpler approach is to replace single newlines with double newlines,
    # and then clean up excessive newlines.
    
    # Replace single newlines with double newlines, unless it's already a double newline
    markdown_content = re.sub(r'(?<!\n)\n(?!\n)', '\n\n', markdown_content)
    
    # Clean up any triple or more newlines to just double newlines
    markdown_content = re.sub(r'\n\n\n+', '\n\n', markdown_content)
    
    # --- END NEW AGGRESSIVE POST-PROCESSING ---
    
    return markdown_content

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert_html_to_md_generic.py <filepath>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    if not os.path.exists(filepath):
        print(f"Error: File not found at {filepath}")
        sys.exit(1)
        
    with open(filepath, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    markdown_content = convert_html_to_md(html_content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
        
    print(f"Successfully converted {filepath} to Markdown.")
