# Steam Username Checker

A simple web application to check if Steam usernames are available for account creation. The app checks Steam profile URLs to determine if a username is already taken, and includes a username generator with customizable options.

**Created by [Nxzume](https://github.com/Nxzume)**

<img width="2558" height="1318" alt="image" src="https://github.com/user-attachments/assets/2a29a5b4-4663-49fe-9dc8-b83eed2bc016" />


## Features

- ✅ Check Steam username availability
- 🎲 Generate multiple username options
- 📝 Dictionary word-based or random username generation
- ⚙️ Customizable options (length, numbers, special characters)
- 🔗 Direct links to taken profiles
- 🛡️ Input sanitization and XSS protection

## Requirements

- Python 3.7 or higher
- pip (Python package manager)

## Installation

1. **Clone or download this repository**

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open your browser and navigate to:**
   ```
   http://127.0.0.1:5000
   ```

## Usage

### Check Username Availability

1. Enter a username in the input field (3-32 characters, letters, numbers, and underscores only)
2. Click "Check" or press Enter
3. View the result - if taken, you'll see a link to the profile

### Generate Usernames

1. Configure your preferences:
   - **Number of options**: How many usernames to generate (1-50)
   - **Length**: Username length (3-32 characters)
   - **Use words**: Toggle between dictionary words or random characters
   - **Include numbers**: Add numbers to generated usernames
   - **Include special chars**: Add underscores to generated usernames

2. Click "Generate Username Options"
3. Review the generated list and click "Check" on any username to verify availability

## How It Works

The application checks Steam profile URLs (`https://steamcommunity.com/id/<username>`) to determine if a username is available. Steam returns different responses for existing vs. non-existing profiles, which the app analyzes to determine availability.

**Note:** This tool checks Steam profile URLs. Results may not be 100% accurate for account creation, as Steam may have additional restrictions or reserved usernames.

## Security Features

- Input sanitization to prevent injection attacks
- HTML escaping to prevent XSS vulnerabilities
- URL validation for profile links
- Security headers (CSP, X-Frame-Options, etc.)

## Project Structure

```
.
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── templates/
│   └── index.html      # Main HTML template
└── static/
    ├── style.css       # Stylesheet
    └── script.js       # Frontend JavaScript
```

## Author

Created by [Nxzume](https://github.com/Nxzume)

## License

This project is open source and available for personal use.

## Disclaimer

This tool is for informational purposes only. Steam's username availability may change, and this tool does not guarantee that a username will be available for account creation. Always verify availability directly on Steam when creating an account.



