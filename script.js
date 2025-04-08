// Function to sanitize messages by removing unnecessary characters
function sanitizeMessage(message) {
    return message.replace(/[#*]/g, '').replace(/(\r\n|\n|\r)/g, ' ').trim();
}

// Function to format the message into structured points
function formatMessage(message) {
    const formattedMessage = message
        .split('\n')
        .map(line => `<li>${sanitizeMessage(line)}</li>`)
        .join('');
    return `<ul>${formattedMessage}</ul>`;
}

// Function to display messages in the chat window
function displayMessage(message, sender, isLive = true) {
    const messageContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    const formattedMessage = formatMessage(message);

    if (sender === 'bot') {
        if (isLive) {
            messageElement.innerHTML = `
                <div class="bot-message">
                    <img src="bot.png" alt="Bot" class="bot-icon"/>
                    <p class="typing-effect"></p>
                </div>`;
            messageContainer.appendChild(messageElement);
            messageContainer.scrollTop = messageContainer.scrollHeight;
            simulateTyping(messageElement.querySelector('.typing-effect'), message);
        } else {
            messageElement.innerHTML = `
                <div class="bot-message">
                    <img src="bot.png" alt="Bot" class="bot-icon"/> ${formattedMessage}
                </div>`;
            messageContainer.appendChild(messageElement);
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    } else {
        messageElement.innerHTML = formattedMessage;
        messageContainer.appendChild(messageElement);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

// Function to simulate the typing effect
function simulateTyping(element, message) {
    let i = 0;
    const speed = 5;
    const typingInterval = setInterval(() => {
        if (i < message.length) {
            element.innerHTML += message.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
            element.innerHTML = formatMessage(message);
        }
    }, speed);
}

// Maintain conversation history
let conversationHistory = [];

// Function to load chat history from localStorage
function loadChatHistory() {
    const chatHistoryContainer = document.getElementById('chatHistory');
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    chatHistoryContainer.innerHTML = ''; // Clear current chat history
    
    chats.forEach((chat, index) => {
        const chatElement = document.createElement('div');
        chatElement.classList.add('chat-item');
        chatElement.textContent = `Chat ${index + 1}: ${chat.firstQuestion || 'No Question'}`;
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-btn');
        deleteButton.textContent = 'X';
        deleteButton.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering the chat load event
            deleteChat(index); // Delete the chat at the clicked index
        };
        
        // Append delete button to chat item
        chatElement.appendChild(deleteButton);
        chatElement.onclick = () => loadChat(index); // When clicked, load the specific chat
        chatHistoryContainer.appendChild(chatElement);
    });
}

// Function to load a specific chat from history
function loadChat(index) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    const chat = chats[index];
    
    document.getElementById('messages').innerHTML = ''; // Clear current messages
    
    // Display the previous chat messages without typing effect (isLive: false)
    chat.messages.forEach(msg => {
        displayMessage(msg.content, msg.sender, false);
    });
}

// Function to handle user input and display it
function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    
    if (userInput.trim() === '') return;

    displayMessage(userInput, 'user');
    
    document.getElementById('userInput').value = ''; // Clear input field
    
    // Update conversation history
    conversationHistory.push({ role: 'user', content: userInput });
    
    // Call the function to get the bot's response
    getBotResponse(userInput);
}

// Function to get response from the bot API
async function getBotResponse(query) {
    const apiKey = 'API KEY'; // Replace with your actual API key
    const url = '';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: `
                       YASH WRITE PROMPT HEAR` },
                    ...conversationHistory,
                    { role: 'user', content: query }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch response from ChatGPT');
        }

        const data = await response.json();
        const botMessage = data.choices[0].message.content.trim();
        
        // Display bot's response
        displayMessage(botMessage, 'bot');

        // Update conversation history with bot's response
        conversationHistory.push({ role: 'assistant', content: botMessage });

        // Save chat to localStorage (optional)
        saveChat(userInput, botMessage);

    } catch (error) {
        displayMessage('Sorry, I am unable to process your request right now.', 'bot');
        console.error(error);
    }
}

// Function to save chat history to localStorage
function saveChat(userMessage, botMessage) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    if (chats.length > 0 && !chats[chats.length - 1].isComplete) { 
        // Update the last chat
        chats[chats.length - 1].messages.push({ content: userMessage, sender: 'user' });
        chats[chats.length - 1].messages.push({ content: botMessage, sender: 'bot' });
    } else { 
        // Create a new chat if no ongoing chat exists
        const newChat = { 
            messages: [
                { content: userMessage, sender: 'user' },
                { content: botMessage, sender: 'bot' }
            ],
            isComplete: false,
            firstQuestion: userMessage 
        };
        
        chats.push(newChat);
    }
    
    localStorage.setItem('chats', JSON.stringify(chats));
    
    loadChatHistory(); // Refresh the displayed chat history after saving
}

// Function to delete a specific chat from history
function deleteChat(index) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    chats.splice(index, 1); // Remove the chat at the given index
    
    localStorage.setItem('chats', JSON.stringify(chats)); // Save updated chats back to localStorage
    
    loadChatHistory(); // Reload the chat history to reflect the changes
    
    document.getElementById('messages').innerHTML = ''; // Clear the current chat window
}

// Toggle sidebar visibility and adjust chat container size
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');
    
    sidebar.classList.toggle('hidden'); // Toggle sidebar visibility
    appContainer.classList.toggle('full-width'); // Toggle full-screen mode for the chat container
}

// Event listener for toggling sidebar on button click
document.querySelector('.toggle-sidebar-btn').addEventListener('click', toggleSidebar);

// Event Listeners for sending messages and handling input
document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('newChatButton').addEventListener('click', () => { 
   // Mark current chat as complete 
   const chats = JSON.parse(localStorage.getItem('chats')) || []; 
   if (chats.length > 0 && !chats[chats.length - 1].isComplete) { 
       chats[chats.length - 1].isComplete = true; 
       localStorage.setItem('chats', JSON.stringify(chats)); 
   } 
   document.getElementById('messages').innerHTML = ''; // Clear current messages for new chat 
   loadChatHistory(); // Reload chat history after new chat 
});

// Event listener for sending message on pressing "Enter"
document.getElementById('userInput').addEventListener('keydown', (event) => { 
   if (event.key === 'Enter') { 
       sendMessage(); 
       event.preventDefault(); // Prevent default form submission if inside a form 
   } 
});

// Load chat history on page load
window.onload = loadChatHistory;
