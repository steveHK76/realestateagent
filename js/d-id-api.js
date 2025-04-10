// D-ID API wrapper class
class DIDApi {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.d-id.com';
    this.headers = {
      'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
      'Content-Type': 'application/json'
    };
  }

  async call(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: this.headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('D-ID API error:', errorData);
        throw new Error(`D-ID API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error calling D-ID API:', error);
      throw error;
    }
  }

  // Agent methods
  async getAgentDetails(agentId) {
    return await this.call(`/agents/${agentId}`);
  }
  
  // Chat methods
  async createChatSession(agentId) {
    return await this.call(`/agents/${agentId}/chat`, 'POST');
  }
  
  async sendChatMessage(agentId, chatId, message) {
    return await this.call(`/agents/${agentId}/chat/${chatId}`, 'POST', {
      messages: [{
        role: "user",
        content: message,
        created_at: new Date().toISOString()
      }]
    });
  }
  
  // Stream methods
  async createStream(imageUrl) {
    return await this.call('/talks/streams', 'POST', {
      source_url: imageUrl
    });
  }
  
  async sendIceCandidate(streamId, candidate) {
    return await this.call(`/talks/streams/${streamId}/ice`, 'POST', candidate);
  }
  
  async sendAnswer(streamId, answer) {
    return await this.call(`/talks/streams/${streamId}/sdp`, 'POST', {
      answer
    });
  }
  
  async startStream(streamId) {
    return await this.call(`/talks/streams/${streamId}/start`, 'POST');
  }
  
  async connectStreamToChat(agentId, chatId, streamId, sessionId) {
    return await this.call(`/agents/${agentId}/chat/${chatId}`, 'POST', {
      streamId,
      sessionId
    });
  }
}

export default DIDApi;
