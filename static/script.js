
// HTML escaping function to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// URL validation and escaping
function escapeUrl(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'https:') return null;
        if (!urlObj.hostname.endsWith('steamcommunity.com')) return null;
        return url;
    } catch (e) {
        return null;
    }
}

// Show result message
function showResult(message, type) {
    const resultContainer = document.getElementById('resultContainer');
    const resultMessage = document.getElementById('resultMessage');
    if (!resultContainer || !resultMessage) return;
    
    resultContainer.style.display = 'block';
    resultMessage.innerHTML = message;
    resultMessage.className = `result-message ${type}`;
}

// Set loading state for check button
function setLoading(loading) {
    const checkButton = document.getElementById('checkButton');
    const buttonText = document.getElementById('buttonText');
    const buttonLoader = document.getElementById('buttonLoader');
    
    if (!checkButton || !buttonText || !buttonLoader) return;
    
    if (loading) {
        checkButton.disabled = true;
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'block';
    } else {
        checkButton.disabled = false;
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
    }
}

// Set loading state for generate button
function setGenerateLoading(loading) {
    const generateButton = document.getElementById('generateButton');
    const generateButtonText = document.getElementById('generateButtonText');
    const generateButtonLoader = document.getElementById('generateButtonLoader');
    
    if (!generateButton || !generateButtonText || !generateButtonLoader) return;
    
    if (loading) {
        generateButton.disabled = true;
        generateButtonText.style.display = 'none';
        generateButtonLoader.style.display = 'block';
    } else {
        generateButton.disabled = false;
        generateButtonText.style.display = 'inline';
        generateButtonLoader.style.display = 'none';
    }
}

// Check username function
async function checkUsername() {
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) {
        console.error('Username input not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    
    // Basic validation
    if (!username) {
        showResult('Please enter a username', 'error');
        return;
    }
    
    if (username.length < 3) {
        showResult('Username must be at least 3 characters', 'error');
        return;
    }
    
    if (username.length > 32) {
        showResult('Username must be 32 characters or less', 'error');
        return;
    }
    
    // Show loading state
    setLoading(true);
    showResult('Checking availability...', 'checking');
    
    try {
        const response = await fetch('/api/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showResult(escapeHtml(data.error), 'error');
        } else if (data.available === true) {
            showResult(`✅ ${escapeHtml(data.message)}`, 'available');
        } else if (data.available === false) {
            let message = `❌ ${escapeHtml(data.message)}`;
            if (data.profile_url) {
                const safeUrl = escapeUrl(data.profile_url);
                if (safeUrl) {
                    message += `<br><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="profile-link">View Profile →</a>`;
                }
            }
            showResult(message, 'taken');
        } else {
            showResult(escapeHtml(data.error || 'Unable to determine availability'), 'error');
        }
    } catch (error) {
        showResult('Network error. Please try again.', 'error');
        console.error('Error:', error);
    } finally {
        setLoading(false);
    }
}

// Generate usernames function
async function generateUsernames() {
    console.log('generateUsernames called');
    
    const countInput = document.getElementById('usernameCount');
    const lengthInput = document.getElementById('usernameLength');
    const wordsCheckbox = document.getElementById('useWords');
    const includeNumbersCheckbox = document.getElementById('includeNumbers');
    const includeSpecialCheckbox = document.getElementById('includeSpecial');
    
    if (!countInput || !lengthInput || !wordsCheckbox || !includeNumbersCheckbox || !includeSpecialCheckbox) {
        console.error('Could not find input elements');
        showResult('Error: Could not find input elements', 'error');
        return;
    }
    
    const count = parseInt(countInput.value) || 20;
    const length = parseInt(lengthInput.value) || 8;
    const useWords = wordsCheckbox.checked;
    const includeNumbers = includeNumbersCheckbox.checked;
    const includeSpecial = includeSpecialCheckbox.checked;
    
    console.log('Generating:', { count, length, useWords, includeNumbers, includeSpecial });
    
    // Show loading state
    setGenerateLoading(true);
    hideUsernameList();
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                count: count,
                length: length,
                use_words: useWords,
                include_numbers: includeNumbers,
                include_special: includeSpecial
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.error) {
            showResult(escapeHtml(data.error), 'error');
        } else if (data.usernames && Array.isArray(data.usernames)) {
            displayUsernameList(data.usernames);
        } else {
            showResult(escapeHtml('Unable to generate usernames'), 'error');
        }
    } catch (error) {
        console.error('Error generating usernames:', error);
        showResult('Network error. Please try again.', 'error');
    } finally {
        setGenerateLoading(false);
    }
}

// Display username list
function displayUsernameList(usernames) {
    const container = document.getElementById('usernameListContainer');
    const list = document.getElementById('usernameList');
    
    if (!container || !list) {
        console.error('Could not find list container');
        return;
    }
    
    // Clear previous list
    list.innerHTML = '';
    
    // Create username items
    usernames.forEach((username, index) => {
        const item = document.createElement('div');
        item.className = 'username-item';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'username-text';
        usernameSpan.textContent = username;
        
        const button = document.createElement('button');
        button.className = 'check-item-btn';
        button.setAttribute('data-username', username);
        button.setAttribute('data-index', index);
        button.onclick = function() {
            checkSingleUsername(this.getAttribute('data-username'), parseInt(this.getAttribute('data-index')));
        };
        
        const buttonText = document.createElement('span');
        buttonText.className = 'check-btn-text';
        buttonText.textContent = 'Check';
        
        const buttonLoader = document.createElement('span');
        buttonLoader.className = 'check-btn-loader loader';
        buttonLoader.style.display = 'none';
        
        button.appendChild(buttonText);
        button.appendChild(buttonLoader);
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'username-status';
        statusDiv.id = `status-${index}`;
        
        item.appendChild(usernameSpan);
        item.appendChild(button);
        item.appendChild(statusDiv);
        
        list.appendChild(item);
    });
    
    container.style.display = 'block';
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) {
        resultContainer.style.display = 'none';
    }
}

// Hide username list
function hideUsernameList() {
    const container = document.getElementById('usernameListContainer');
    if (container) {
        container.style.display = 'none';
    }
}

// Check single username from list
async function checkSingleUsername(username, index) {
    const item = document.querySelector(`#usernameList .username-item:nth-child(${index + 1})`);
    if (!item) {
        console.error('Could not find username item');
        return;
    }
    
    const button = item.querySelector('.check-item-btn');
    const buttonText = item.querySelector('.check-btn-text');
    const buttonLoader = item.querySelector('.check-btn-loader');
    const statusDiv = document.getElementById(`status-${index}`);
    const usernameInput = document.getElementById('usernameInput');
    
    if (!button || !buttonText || !buttonLoader || !statusDiv) {
        console.error('Could not find required elements for username check');
        return;
    }
    
    // Set loading state
    button.disabled = true;
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'inline-block';
    statusDiv.innerHTML = '';
    statusDiv.className = 'username-status checking';
    
    try {
        const response = await fetch('/api/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        });
        
        const data = await response.json();
        
        if (data.error) {
            statusDiv.innerHTML = `<span class="status-error">${escapeHtml(data.error)}</span>`;
            statusDiv.className = 'username-status error';
        } else if (data.available === true) {
            statusDiv.innerHTML = `<span class="status-available">✅ Available</span>`;
            statusDiv.className = 'username-status available';
            if (usernameInput) {
                usernameInput.value = username;
            }
        } else if (data.available === false) {
            let statusHtml = `<span class="status-taken">❌ Taken</span>`;
            if (data.profile_url) {
                const safeUrl = escapeUrl(data.profile_url);
                if (safeUrl) {
                    statusHtml += ` <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="status-link">View Profile</a>`;
                }
            }
            statusDiv.innerHTML = statusHtml;
            statusDiv.className = 'username-status taken';
        } else {
            statusDiv.innerHTML = `<span class="status-error">Unable to check</span>`;
            statusDiv.className = 'username-status error';
        }
    } catch (error) {
        statusDiv.innerHTML = `<span class="status-error">Network error</span>`;
        statusDiv.className = 'username-status error';
        console.error('Error:', error);
    } finally {
        button.disabled = false;
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
    }
}

// Assign functions to window immediately after they're defined
// This ensures onclick handlers in HTML can access them
window.checkUsername = checkUsername;
window.generateUsernames = generateUsernames;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    // Set up button event listeners
    const checkButton = document.getElementById('checkButton');
    console.log('Check button found:', checkButton);
    if (checkButton) {
        checkButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Check button clicked');
            checkUsername();
        });
    } else {
        console.error('Check button not found!');
    }
    
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', function(e) {
            e.preventDefault();
            generateUsernames();
        });
    }
    
    // Real-time validation for username input
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('input', (e) => {
            const username = e.target.value;
            e.target.value = username.replace(/[^a-zA-Z0-9_]/g, '');
            
            const resultContainer = document.getElementById('resultContainer');
            if (resultContainer && resultContainer.style.display !== 'none') {
                resultContainer.style.display = 'none';
            }
        });
        
        // Enter key support
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkUsername();
            }
        });
    }
    
    console.log('App initialized');
});

