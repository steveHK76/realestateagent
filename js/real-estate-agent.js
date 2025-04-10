import DIDApi from './d-id-api.js';
import WebRTCManager from './webrtc-manager.js';

class RealEstateAgent {
  constructor(apiKey, agentId, leoImageUrl) {
    this.apiKey = apiKey;
    this.agentId = agentId;
    this.leoImageUrl = leoImageUrl;
    this.chatId = null;
    this.didApi = new DIDApi(apiKey);
    this.webrtcManager = new WebRTCManager(this.didApi);
    this.currentLanguage = 'en';
    
    // Property data (would come from a database in a real application)
    this.properties = [
      {
        id: 1,
        title: 'Luxury Apartment in Causeway Bay',
        location: 'Hong Kong',
        price: 'HK$15,800,000',
        bedrooms: 3,
        bathrooms: 2,
        area: 890,
        image: 'https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        keywords: ['hong kong', 'apartment', 'causeway bay', 'luxury']
      },
      {
        id: 2,
        title: 'Modern Condo in Marina Bay',
        location: 'Singapore',
        price: 'S$2,450,000',
        bedrooms: 2,
        bathrooms: 2,
        area: 1100,
        image: 'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        keywords: ['singapore', 'condo', 'marina bay', 'modern']
      },
      {
        id: 3,
        title: 'Historic Villa in Tuscany',
        location: 'Italy',
        price: '€1,750,000',
        bedrooms: 5,
        bathrooms: 4,
        area: 3200,
        image: 'https://images.unsplash.com/photo-1549517045-bc93de075e53?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        keywords: ['italy', 'villa', 'tuscany', 'historic']
      }
    ];
  }
  
  async initialize(videoElementId, chatContainerId, propertyContainerId) {
    console.log('Initializing Real Estate Agent...');
    this.videoElement = document.getElementById(videoElementId);
    this.chatContainer = document.getElementById(chatContainerId);
    this.propertyContainer = document.getElementById(propertyContainerId);
    
    try {
      // Set up chat session
      console.log('Creating chat session...');
      const chatResponse = await this.didApi.createChatSession(this.agentId);
      console.log('Chat session created:', chatResponse);
      this.chatId = chatResponse.id;
      
      // Set up video stream
      console.log('Setting up video stream...');
      const streamId = await this.webrtcManager.setupStream(this.leoImageUrl, videoElementId);
      console.log('Stream set up:', streamId);
      
      // Connect stream to chat
      console.log('Connecting stream to chat...');
      const sessionId = this.webrtcManager.getSessionId();
      await this.didApi.connectStreamToChat(
        this.agentId, 
        this.chatId, 
        streamId,
        sessionId
      );
      console.log('Stream connected to chat');
      
      // Add welcome message
      console.log('Adding welcome message...');
      this.addMessage('Leo', this.getWelcomeMessage(), 'agent');
      
      // Set up event listeners
      console.log('Setting up event listeners...');
      this.setupEventListeners();
      
      // Load properties
      console.log('Loading properties...');
      this.updatePropertyDisplay(this.properties);
      
      console.log('Initialization complete');
    } catch (error) {
      console.error('Error initializing Real Estate Agent:', error);
      this.addMessage('System', 'There was an error connecting to Leo. Please refresh the page and try again.', 'system');
    }
  }
  
  setupEventListeners() {
    // Send message button
    document.getElementById('send-button').addEventListener('click', () => {
      this.sendUserMessage();
    });
    
    // Message input enter key
    document.getElementById('message-input').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.sendUserMessage();
      }
    });
    
    // Language selection
    document.querySelectorAll('.language-selector button').forEach(button => {
      button.addEventListener('click', () => {
        this.setLanguage(button.dataset.lang);
      });
    });
  }
  
  async sendUserMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Display user message
    this.addMessage('You', message, 'user');
    
    // Clear input
    input.value = '';
    
    try {
      // Send to D-ID
      console.log('Sending message to D-ID:', message);
      await this.didApi.sendChatMessage(this.agentId, this.chatId, message);
      
      // Response will be received through the WebRTC stream
      // We could also manually get the response and display it if needed
      
      // Check if message contains property-related keywords
      this.displayRelevantProperties(message);
    } catch (error) {
      console.error('Error sending message:', error);
      this.addMessage('System', 'There was an error sending your message. Please try again.', 'system');
    }
  }
  
  addMessage(sender, text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    this.chatContainer.appendChild(messageDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
  
  setLanguage(langCode) {
    console.log('Changing language to:', langCode);
    this.currentLanguage = langCode;
    
    // Update welcome message based on language
    document.querySelectorAll('.language-selector button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.language-selector button[data-lang="${langCode}"]`).classList.add('active');
    
    // Send language change notification to Leo
    const langMessages = {
      'en': 'Please speak to me in English from now on.',
      'zh-Hans': '请从现在开始用简体中文与我交流。',
      'zh-Hant': '請從現在開始用繁體中文與我交流。',
      'it': 'Per favore, parlami in italiano d\'ora in poi.'
    };
    
    this.didApi.sendChatMessage(this.agentId, this.chatId, langMessages[langCode]);
  }
  
  getWelcomeMessage() {
    const welcomeMessages = {
      'en': 'Hi, I\'m Leo Multi Language Real Estate Agent. How can I help you find your perfect property in Hong Kong, Singapore, or Italy today?',
      'zh-Hans': '您好，我是Leo多语言房地产顾问。今天我能如何帮您在香港、新加坡或意大利寻找理想的房产？',
      'zh-Hant': '您好，我是Leo多語言房地產顧問。今天我能如何幫您在香港、新加坡或意大利尋找理想的房產？',
      'it': 'Buongiorno, sono Leo, Agente Immobiliare Multilingue. Come posso aiutarla oggi a trovare la proprietà perfetta a Hong Kong, Singapore o in Italia?'
    };
    
    return welcomeMessages[this.currentLanguage];
  }
  
  displayRelevantProperties(message) {
    // Simple keyword matching - in a real implementation, you would use NLP or a more sophisticated approach
    const messageLower = message.toLowerCase();
    
    const relevantProperties = this.properties.filter(property => {
      return property.keywords.some(keyword => messageLower.includes(keyword));
    });
    
    if (relevantProperties.length > 0) {
      this.updatePropertyDisplay(relevantProperties);
    }
  }
  
  updatePropertyDisplay(properties) {
    this.propertyContainer.innerHTML = '';
    
    properties.forEach(property => {
      const propertyCard = document.createElement('div');
      propertyCard.className = 'property-card';
      propertyCard.innerHTML = `
        <img src="${property.image}" alt="${property.title}">
        <h4>${property.title}</h4>
        <p class="location">${property.location}</p>
        <p class="price">${property.price}</p>
        <p class="details">${property.bedrooms} BR | ${property.bathrooms} BA | ${property.area} sq.ft</p>
        <button class="view-details" data-id="${property.id}">View Details</button>
      `;
      this.propertyContainer.appendChild(propertyCard);
    });
    
    // Add event listeners to property cards
    document.querySelectorAll('.view-details').forEach(button => {
      button.addEventListener('click', () => {
        const propertyId = parseInt(button.dataset.id);
        this.showPropertyDetails(propertyId);
      });
    });
  }
  
  showPropertyDetails(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    // In a real implementation, you'd show a modal with property details
    // For demo purposes, we'll just add a message to the chat
    const propertyQuery = `Tell me more about the ${property.title} property`;
    document.getElementById('message-input').value = propertyQuery;
    
    // Show an alert for demonstration
    alert(`Selected: ${property.title}\nPrice: ${property.price}\nLocation: ${property.location}\n\nA message has been prepared for you to send to Leo.`);
  }
  
  collectUserData(name, email, phone, interests) {
    console.log('Collecting user data:', { name, email, phone, interests });
    
    // In a real implementation, you would send this to your CRM/email system
    const userData = {
      name,
      email,
      phone,
      interests,
      timestamp: new Date().toISOString(),
      agentId: this.agentId,
      chatId: this.chatId
    };
    
    console.log('User data collected:', userData);
    
    // Here you would integrate with your email/CRM system
    // Example code for integrating with an email API:
    /*
    fetch('https://your-api.com/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Lead submitted successfully:', data);
    })
    .catch(error => {
      console.error('Error submitting lead:', error);
    });
    */
  }
}

export default RealEstateAgent;
