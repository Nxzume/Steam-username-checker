from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from markupsafe import escape
import requests
import re
import random
import string
import time
import urllib.parse
import os

# Try to import nltk for dictionary words
try:
    import nltk
    from nltk.corpus import words as nltk_words
    # Download words corpus if not already downloaded
    try:
        nltk.data.find('corpora/words')
    except LookupError:
        nltk.download('words', quiet=True)
    DICTIONARY_WORDS = set(w.lower() for w in nltk_words.words() if w.isalpha() and len(w) >= 3)
    HAS_DICTIONARY = True
except (ImportError, Exception):
    # Fallback: use a basic word list if nltk is not available
    DICTIONARY_WORDS = set()
    HAS_DICTIONARY = False

app = Flask(__name__)
CORS(app)


def sanitize_username(username):
    """
    Sanitize and validate username input to prevent injection attacks.
    Returns sanitized username or None if invalid.
    """
    if not username:
        return None
    
    # Strip whitespace
    username = username.strip()
    
    # Validate length
    if len(username) < 3 or len(username) > 32:
        return None
    
    # Only allow alphanumeric and underscores (strict validation)
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return None
    
    # Additional check: ensure no dangerous patterns
    dangerous_patterns = ['<', '>', '"', "'", '&', '/', '\\', ';', '(', ')', '{', '}', '[', ']']
    if any(pattern in username for pattern in dangerous_patterns):
        return None
    
    return username

def check_steam_username_availability(username):
    """
    Check if a Steam username is available by attempting to access the profile.
    Steam usernames must be 3-32 characters and can contain letters, numbers, and underscores.
    """
    # Sanitize username first
    username = sanitize_username(username)
    if not username:
        return {
            'available': False,
            'error': 'Invalid username format'
        }
    
    try:
        # Steam uses vanity URLs: https://steamcommunity.com/id/<username>
        # Don't URL encode if username is already safe (alphanumeric + underscore)
        # Only encode if there are special characters (which shouldn't happen after sanitization)
        if re.match(r'^[a-zA-Z0-9_]+$', username):
            # Username is safe, use it directly
            profile_url = f"https://steamcommunity.com/id/{username}"
        else:
            # URL encode only if needed (shouldn't happen after sanitization)
            encoded_username = urllib.parse.quote(username, safe='')
            profile_url = f"https://steamcommunity.com/id/{encoded_username}"
        
        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
        
        # Follow redirects to get the final status
        response = requests.get(profile_url, headers=headers, timeout=10, allow_redirects=True)
        
        # Check response content to determine if profile exists
        # Steam returns 200 even for non-existent profiles, but the content differs
        response_text = response.text.lower()
        
        # Escape username in messages to prevent XSS
        safe_username = escape(username)
        
        # Check for indicators that profile doesn't exist
        # Steam shows "The specified profile could not be found" or similar messages
        not_found_indicators = [
            'could not be found',
            'profile could not be found',
            'specified profile',
            'invalid profile url',
            'profile not found',
            'the page you are looking for is unavailable'
        ]
        
        # Check if any not-found indicators are in the response
        is_not_found = any(indicator in response_text for indicator in not_found_indicators)
        
        # Also check if we got redirected to a numeric Steam ID (means profile exists but uses different vanity)
        # Or if we're still on the /id/ path (means it's a valid vanity URL)
        final_url = response.url.lower()
        is_valid_profile = '/profiles/' in final_url or '/id/' in final_url
        
        if response.status_code == 404 or is_not_found:
            return {
                'available': True,
                'username': username,
                'message': f'Username "{safe_username}" appears to be available'
            }
        elif response.status_code == 200 and is_valid_profile and not is_not_found:
            return {
                'available': False,
                'username': username,
                'message': f'Username "{safe_username}" is already taken',
                'profile_url': response.url
            }
        else:
            # Default to available if we can't determine (better UX)
            return {
                'available': True,
                'username': username,
                'message': f'Username "{safe_username}" appears to be available'
            }
            
    except requests.exceptions.Timeout:
        return {
            'available': None,
            'username': username,
            'error': 'Request timed out. Please try again.'
        }
    except requests.exceptions.RequestException as e:
        return {
            'available': None,
            'username': username,
            'error': f'Error checking username: {str(e)}'
        }

@app.after_request
def set_security_headers(response):
    """Set security headers and fix MIME types for static files."""
    # Fix MIME types for static files (Flask sometimes serves JS as text/plain)
    path = request.path
    content_type = response.headers.get('Content-Type', '')
    
    if path.endswith('.js'):
        if 'text/plain' in content_type or 'text/html' in content_type or not content_type:
            response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    elif path.endswith('.css'):
        if 'text/plain' in content_type or 'text/html' in content_type or not content_type:
            response.headers['Content-Type'] = 'text/css; charset=utf-8'
    
    # Set security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    return response

@app.route('/')
def index():
    return render_template('index.html')


def generate_random_username(length=8, include_numbers=True, include_special=True):
    """
    Generate a random username following Steam's rules.
    Usernames can contain letters, numbers, and underscores.
    """
    # Ensure length is within valid range
    length = max(3, min(32, length))
    
    # Build character set based on options
    char_set = string.ascii_lowercase
    if include_numbers:
        char_set += string.digits
    if include_special:
        char_set += '_'
    
    # Start with a letter to make it more readable
    username = random.choice(string.ascii_lowercase)
    # Add remaining characters
    for _ in range(length - 1):
        username += random.choice(char_set)
    return username

def generate_word_based_username(length=8, include_numbers=True, include_special=True):
    """
    Generate a username based on dictionary words with optional numbers/underscores.
    """
    length = max(3, min(32, length))
    
    if not HAS_DICTIONARY or not DICTIONARY_WORDS:
        # Fallback to random if dictionary not available
        return generate_random_username(length, include_numbers, include_special)
    
    # Build addition character set
    addition_chars = ''
    if include_numbers:
        addition_chars += string.digits
    if include_special:
        addition_chars += '_'
    
    # If no additions allowed, just use words
    if not addition_chars:
        suitable_words = [w for w in DICTIONARY_WORDS if len(w) == length]
        if suitable_words:
            return random.choice(suitable_words)
        # Fallback if no exact length words
        return generate_random_username(length, False, False)
    
    # Filter words that fit the length requirement (leave room for numbers/underscores)
    max_word_length = length - 1  # Leave at least 1 char for number/underscore
    suitable_words = [w for w in DICTIONARY_WORDS if 3 <= len(w) <= max_word_length]
    
    if not suitable_words:
        # Fallback to random if no suitable words
        return generate_random_username(length, include_numbers, include_special)
    
    word = random.choice(suitable_words)
    remaining = length - len(word)
    
    if remaining > 0:
        # Add numbers or underscores based on options
        additions = ''.join(random.choice(addition_chars) for _ in range(remaining))
        # Randomly decide: word + additions or additions + word
        if random.choice([True, False]):
            username = word + additions
        else:
            username = additions[:remaining//2] + word + additions[remaining//2:]
    else:
        username = word
    
    # Ensure it starts with a letter
    if not username[0].isalpha():
        username = random.choice(string.ascii_lowercase) + username[1:]
    
    # Truncate to exact length if needed
    return username[:length]

def generate_usernames(count=20, length=8, use_words=False, include_numbers=True, include_special=True):
    """
    Generate multiple unique usernames.
    Returns a list of unique usernames.
    """
    usernames = set()
    max_attempts = count * 3  # Try up to 3x to get unique names
    
    for _ in range(max_attempts):
        if len(usernames) >= count:
            break
        
        if use_words:
            username = generate_word_based_username(length, include_numbers, include_special)
        else:
            username = generate_random_username(length, include_numbers, include_special)
        
        # Ensure uniqueness
        if username not in usernames:
            usernames.add(username)
    
    return list(usernames)[:count]


@app.route('/api/check', methods=['POST'])
def check_username():
    # Validate content type
    if not request.is_json:
        return jsonify({
            'available': False,
            'error': 'Invalid request format'
        }), 400
    
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({
            'available': False,
            'error': 'Invalid request data'
        }), 400
    
    username = data.get('username', '')
    
    # Sanitize input
    if not username:
        return jsonify({
            'available': False,
            'error': 'Username is required'
        }), 400
    
    # Additional validation: ensure username is a string
    if not isinstance(username, str):
        return jsonify({
            'available': False,
            'error': 'Username must be a string'
        }), 400
    
    result = check_steam_username_availability(username)
    return jsonify(result)

@app.route('/api/generate', methods=['POST'])
def generate_usernames_endpoint():
    # Validate content type
    if not request.is_json:
        return jsonify({
            'error': 'Invalid request format'
        }), 400
    
    data = request.get_json() or {}
    if not isinstance(data, dict):
        data = {}
    
    # Safely extract and validate parameters
    count = data.get('count', 20)
    length = data.get('length', 8)
    use_words = data.get('use_words', False)
    include_numbers = data.get('include_numbers', True)
    include_special = data.get('include_special', True)
    
    # Ensure parameters are correct types
    try:
        count = int(count) if isinstance(count, (int, str)) else 20
        length = int(length) if isinstance(length, (int, str)) else 8
        use_words = bool(use_words) if isinstance(use_words, (bool, str)) else False
        include_numbers = bool(include_numbers) if isinstance(include_numbers, (bool, str)) else True
        include_special = bool(include_special) if isinstance(include_special, (bool, str)) else True
    except (ValueError, TypeError):
        return jsonify({
            'error': 'Invalid parameter types'
        }), 400
    
    # Validate and constrain parameters
    count = max(1, min(50, count))  # Between 1 and 50
    length = max(3, min(32, length))  # Between 3 and 32
    
    # Generate usernames
    usernames = generate_usernames(count, length, use_words, include_numbers, include_special)
    
    return jsonify({
        'usernames': usernames,
        'count': len(usernames)
    })

if __name__ == '__main__':
    # Run on localhost by default for desktop use
    app.run(host='127.0.0.1', port=5000, debug=True)

