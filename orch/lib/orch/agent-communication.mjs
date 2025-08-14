/**
 * Agent Communication System
 * Handles inter-agent messaging, collaboration, and coordination
 */

import { EventEmitter } from 'node:events';

export class CommunicationHub extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.messageHistory = [];
    this.activeConversations = new Map();
  }

  /**
   * Create a communication channel
   */
  createChannel(name, participants = []) {
    const channel = {
      id: `channel-${Date.now()}`,
      name,
      participants: new Set(participants),
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    this.channels.set(channel.id, channel);
    this.emit('channel:created', channel);
    return channel.id;
  }

  /**
   * Send message to a channel
   */
  sendToChannel(channelId, message) {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    const fullMessage = {
      ...message,
      channelId,
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}`
    };
    
    channel.messages.push(fullMessage);
    this.messageHistory.push(fullMessage);
    
    // Notify channel participants
    for (const participant of channel.participants) {
      this.emit(`message:${participant}`, fullMessage);
    }
    
    this.emit('message:sent', fullMessage);
    return fullMessage;
  }

  /**
   * Direct message between agents
   */
  sendDirectMessage(from, to, content) {
    const message = {
      type: 'direct',
      from,
      to,
      content,
      timestamp: new Date().toISOString(),
      id: `dm-${Date.now()}`
    };
    
    this.messageHistory.push(message);
    this.emit(`message:${to}`, message);
    this.emit('message:sent', message);
    
    return message;
  }

  /**
   * Broadcast message to all agents
   */
  broadcast(from, content) {
    const message = {
      type: 'broadcast',
      from,
      content,
      timestamp: new Date().toISOString(),
      id: `broadcast-${Date.now()}`
    };
    
    this.messageHistory.push(message);
    this.emit('message:broadcast', message);
    
    return message;
  }

  /**
   * Start a conversation between agents
   */
  startConversation(initiator, participants, topic) {
    const conversation = {
      id: `conv-${Date.now()}`,
      initiator,
      participants: new Set([initiator, ...participants]),
      topic,
      messages: [],
      status: 'active',
      startedAt: new Date().toISOString()
    };
    
    this.activeConversations.set(conversation.id, conversation);
    this.emit('conversation:started', conversation);
    
    return conversation.id;
  }

  /**
   * Add message to conversation
   */
  addToConversation(conversationId, from, content) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    const message = {
      from,
      content,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(message);
    
    // Notify participants
    for (const participant of conversation.participants) {
      if (participant !== from) {
        this.emit(`conversation:message:${participant}`, {
          conversationId,
          message
        });
      }
    }
    
    return message;
  }

  /**
   * End a conversation
   */
  endConversation(conversationId, summary) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    conversation.status = 'completed';
    conversation.endedAt = new Date().toISOString();
    conversation.summary = summary;
    
    this.emit('conversation:ended', conversation);
    return conversation;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId) {
    const conversation = this.activeConversations.get(conversationId);
    return conversation ? conversation.messages : [];
  }

  /**
   * Get agent's messages
   */
  getAgentMessages(agentName, limit = 100) {
    return this.messageHistory
      .filter(msg => msg.from === agentName || msg.to === agentName)
      .slice(-limit);
  }
}

/**
 * Collaboration Protocol for structured agent interactions
 */
export class CollaborationProtocol {
  constructor(hub) {
    this.hub = hub;
    this.protocols = new Map();
  }

  /**
   * Define a collaboration protocol
   */
  defineProtocol(name, steps) {
    this.protocols.set(name, {
      name,
      steps,
      instances: new Map()
    });
  }

  /**
   * Start a protocol instance
   */
  async startProtocol(protocolName, agents, context) {
    const protocol = this.protocols.get(protocolName);
    if (!protocol) {
      throw new Error(`Protocol ${protocolName} not found`);
    }
    
    const instance = {
      id: `protocol-${Date.now()}`,
      protocol: protocolName,
      agents,
      context,
      currentStep: 0,
      results: [],
      status: 'running',
      startedAt: new Date().toISOString()
    };
    
    protocol.instances.set(instance.id, instance);
    
    // Execute protocol steps
    for (const step of protocol.steps) {
      const stepResult = await this.executeStep(instance, step);
      instance.results.push(stepResult);
      instance.currentStep++;
      
      if (stepResult.action === 'abort') {
        instance.status = 'aborted';
        break;
      }
    }
    
    if (instance.status === 'running') {
      instance.status = 'completed';
      instance.completedAt = new Date().toISOString();
    }
    
    return instance;
  }

  /**
   * Execute a protocol step
   */
  async executeStep(instance, step) {
    const result = {
      step: step.name,
      timestamp: new Date().toISOString()
    };
    
    switch (step.type) {
      case 'request':
        // Agent requests information from another agent
        result.response = await this.handleRequest(
          instance.agents[step.from],
          instance.agents[step.to],
          step.request
        );
        break;
        
      case 'review':
        // Agent reviews another agent's work
        result.feedback = await this.handleReview(
          instance.agents[step.reviewer],
          instance.agents[step.reviewee],
          step.artifact
        );
        break;
        
      case 'consensus':
        // Multiple agents reach consensus
        result.decision = await this.handleConsensus(
          step.agents.map(a => instance.agents[a]),
          step.topic
        );
        break;
        
      case 'delegation':
        // Delegate task to another agent
        result.delegated = await this.handleDelegation(
          instance.agents[step.from],
          instance.agents[step.to],
          step.task
        );
        break;
        
      default:
        result.action = 'skip';
    }
    
    return result;
  }

  /**
   * Handle information request between agents
   */
  async handleRequest(fromAgent, toAgent, request) {
    const conversationId = this.hub.startConversation(
      fromAgent,
      [toAgent],
      `Request: ${request}`
    );
    
    // Simulate agent response
    const response = {
      request,
      response: `Information about ${request}`,
      providedBy: toAgent
    };
    
    this.hub.addToConversation(conversationId, toAgent, response.response);
    this.hub.endConversation(conversationId, 'Request fulfilled');
    
    return response;
  }

  /**
   * Handle review process
   */
  async handleReview(reviewer, reviewee, artifact) {
    return {
      reviewer,
      reviewee,
      artifact,
      feedback: 'Review completed',
      approved: true,
      suggestions: []
    };
  }

  /**
   * Handle consensus building
   */
  async handleConsensus(agents, topic) {
    const votes = {};
    
    for (const agent of agents) {
      // Each agent votes
      votes[agent] = Math.random() > 0.3; // Simplified voting
    }
    
    const approved = Object.values(votes).filter(v => v).length > agents.length / 2;
    
    return {
      topic,
      votes,
      consensus: approved ? 'approved' : 'rejected'
    };
  }

  /**
   * Handle task delegation
   */
  async handleDelegation(fromAgent, toAgent, task) {
    return {
      delegatedFrom: fromAgent,
      delegatedTo: toAgent,
      task,
      accepted: true,
      estimatedCompletion: '2 hours'
    };
  }
}

/**
 * Knowledge sharing system for agents
 */
export class KnowledgeBase {
  constructor() {
    this.knowledge = new Map();
    this.sharedArtifacts = new Map();
  }

  /**
   * Store knowledge entry
   */
  addKnowledge(agent, category, entry) {
    const key = `${agent}:${category}`;
    if (!this.knowledge.has(key)) {
      this.knowledge.set(key, []);
    }
    
    const knowledge = {
      ...entry,
      contributor: agent,
      timestamp: new Date().toISOString()
    };
    
    this.knowledge.get(key).push(knowledge);
    return knowledge;
  }

  /**
   * Query knowledge base
   */
  queryKnowledge(category, query) {
    const results = [];
    
    for (const [key, entries] of this.knowledge) {
      if (key.includes(category)) {
        const matches = entries.filter(e => 
          JSON.stringify(e).toLowerCase().includes(query.toLowerCase())
        );
        results.push(...matches);
      }
    }
    
    return results;
  }

  /**
   * Share artifact between agents
   */
  shareArtifact(from, artifact) {
    const shared = {
      ...artifact,
      sharedBy: from,
      sharedAt: new Date().toISOString(),
      id: `artifact-${Date.now()}`
    };
    
    this.sharedArtifacts.set(shared.id, shared);
    return shared.id;
  }

  /**
   * Get shared artifact
   */
  getArtifact(artifactId) {
    return this.sharedArtifacts.get(artifactId);
  }

  /**
   * Get all artifacts from an agent
   */
  getAgentArtifacts(agent) {
    return Array.from(this.sharedArtifacts.values())
      .filter(a => a.sharedBy === agent);
  }
}

// Export singleton instances
export const communicationHub = new CommunicationHub();
export const collaborationProtocol = new CollaborationProtocol(communicationHub);
export const knowledgeBase = new KnowledgeBase();

// Define standard protocols
collaborationProtocol.defineProtocol('code-review', [
  { name: 'Submit Code', type: 'delegation', from: 0, to: 1, task: 'review code' },
  { name: 'Review Code', type: 'review', reviewer: 1, reviewee: 0, artifact: 'code' },
  { name: 'Address Feedback', type: 'request', from: 0, to: 1, request: 'clarification' },
  { name: 'Final Approval', type: 'consensus', agents: [0, 1], topic: 'code approval' }
]);

collaborationProtocol.defineProtocol('feature-planning', [
  { name: 'Requirements Gathering', type: 'request', from: 0, to: 1, request: 'requirements' },
  { name: 'Technical Design', type: 'delegation', from: 1, to: 2, task: 'create design' },
  { name: 'Design Review', type: 'review', reviewer: 0, reviewee: 2, artifact: 'design' },
  { name: 'Team Consensus', type: 'consensus', agents: [0, 1, 2], topic: 'design approval' }
]);