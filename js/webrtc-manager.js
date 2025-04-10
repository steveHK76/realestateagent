// WebRTC connection manager
class WebRTCManager {
  constructor(didApi) {
    this.didApi = didApi;
    this.peerConnection = null;
    this.streamId = null;
    this.videoElement = null;
  }
  
  async setupStream(imageUrl, videoElementId) {
    console.log('Setting up WebRTC stream...');
    this.videoElement = document.getElementById(videoElementId);
    
    if (!this.videoElement) {
      throw new Error(`Video element with ID ${videoElementId} not found`);
    }
    
    try {
      // Create stream with D-ID
      console.log('Creating D-ID stream...');
      const streamData = await this.didApi.createStream(imageUrl);
      console.log('Stream created:', streamData);
      this.streamId = streamData.id;
      
      // Setup WebRTC connection
      console.log('Setting up WebRTC connection...');
      this.peerConnection = new RTCPeerConnection({
        iceServers: streamData.ice_servers
      });
      
      // Handle incoming tracks (video)
      this.peerConnection.ontrack = (event) => {
        console.log('Received track:', event);
        if (this.videoElement.srcObject !== event.streams[0]) {
          console.log('Setting video source:', event.streams[0]);
          this.videoElement.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate:', event.candidate);
          await this.didApi.sendIceCandidate(this.streamId, {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          });
        }
      };
      
      // Set remote description from D-ID's offer
      console.log('Setting remote description...');
      await this.peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: streamData.offer.sdp
      });
      
      // Create and set local answer
      console.log('Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      console.log('Setting local description...');
      await this.peerConnection.setLocalDescription(answer);
      
      // Send answer to D-ID
      console.log('Sending answer to D-ID...');
      await this.didApi.sendAnswer(this.streamId, this.peerConnection.localDescription);
      
      // Start the stream
      console.log('Starting stream...');
      await this.didApi.startStream(this.streamId);
      
      console.log('Stream setup complete');
      return this.streamId;
    } catch (error) {
      console.error('Error setting up WebRTC stream:', error);
      throw error;
    }
  }
  
  getStreamId() {
    return this.streamId;
  }
  
  getSessionId() {
    // Get the session ID from cookies (if needed by D-ID)
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('session='))
      ?.split('=')[1] || 'default-session';
  }
}

export default WebRTCManager;
