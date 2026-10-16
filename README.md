# Steam Username Checker

Free [Steam username checker](https://steam.nozume.com/) to see if a Steam vanity URL is available and generate username ideas.

Live site: https://steam.nozume.com/

## Features

- ✅ Check Steam username availability
- 🎲 Generate multiple username options
- 📚 Use dictionary words or random characters
- ⚙️ Customize username count and length
- 🎨 Modern, beautiful UI
- 📱 Responsive design
- ⚡ Fast and efficient checking
- 🔒 Secure input validation

## Installation

1. Install Python 3.7 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. The first time you run the app, NLTK will automatically download the words corpus for dictionary-based username generation. This is a one-time download.

## Usage

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Enter a username to check its availability on Steam, or:
   - Set the number of usernames to generate (1-50)
   - Set the desired length (3-32 characters)
   - Choose between dictionary words or random characters
   - Click "Generate Username Options" to see a list
   - Click "Check" on any generated username to verify availability

## How It Works

The application checks Steam username availability by attempting to access the Steam profile URL for the given username. If the profile doesn't exist (404 error), the username is likely available. If the profile exists, the username is taken.

## Notes

- Usernames must be 3-32 characters
- Usernames can only contain letters, numbers, and underscores
- Results are based on Steam profile URL availability and may not be 100% accurate for account creation, as Steam may have additional restrictions

## License

MIT

