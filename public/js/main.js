/**
 * AI-Powered Procurement System - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Demo form submissions
  initFormSubmissions();
  
  // Opportunity selection
  initOpportunitySelection();
  
  // AI assistant chat functionality
  initAIAssistant();
  
  // Tab navigation tracking
  initTabTracking();
  
  // Document generation
  initDocumentGeneration();
  
});

/**
 * Initialize form submission handlers
 */
function initFormSubmissions() {
  // Opportunity search form
  const opportunitySearchForm = document.getElementById('opportunitySearchForm');
  if (opportunitySearchForm) {
    opportunitySearchForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Show spinner
      document.getElementById('searchSpinner').classList.remove('d-none');
      document.getElementById('searchButton').disabled = true;
      
      // Simulate API call delay
      setTimeout(function() {
        // Hide spinner
        document.getElementById('searchSpinner').classList.add('d-none');
        document.getElementById('searchButton').disabled = false;
        
        // Add AI assistant message
        addAssistantMessage('aiAssistantChat', 'I found 3 opportunities matching your criteria, sorted by match score. The top result has a 94% match to your company profile.');
      }, 1500);
    });
  }
  
  // Document generation form
  const documentGenerationForm = document.getElementById('documentGenerationForm');
  if (documentGenerationForm) {
    documentGenerationForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Show spinner
      document.getElementById('generateSpinner').classList.remove('d-none');
      document.getElementById('generateButton').disabled = true;
      
      // Simulate API call delay
      setTimeout(function() {
        // Hide spinner
        document.getElementById('generateSpinner').classList.add('d-none');
        document.getElementById('generateButton').disabled = false;
        
        // Show document content, hide placeholder
        document.getElementById('documentPlaceholder').classList.add('d-none');
        document.getElementById('documentContent').classList.remove('d-none');
        
        // Add AI assistant message
        addAssistantMessage('aiDocumentChat', 'I\'ve generated the document based on your selections. The executive summary highlights your company\'s past performance with DHS and emphasizes your NIST compliance expertise.');
      }, 2000);
    });
  }
}

/**
 * Initialize opportunity selection functionality
 */
function initOpportunitySelection() {
  const opportunityButtons = document.querySelectorAll('.opportunity-select');
  const closeButton = document.getElementById('closeOpportunityDetails');
  
  opportunityButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Show opportunity details
      document.getElementById('opportunityDetails').classList.remove('d-none');
      
      // Add AI assistant message
      addAssistantMessage('aiAssistantChat', 'This opportunity has a high technical match score of 92% for your company profile. Your previous experience with DHS is a strong advantage.');
    });
  });
  
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      document.getElementById('opportunityDetails').classList.add('d-none');
    });
  }
}

/**
 * Initialize AI assistant chat functionality
 */
function initAIAssistant() {
  const assistantInputs = [
    { input: 'aiAssistantInput', button: 'aiAssistantButton', chat: 'aiAssistantChat' },
    { input: 'aiStrategyInput', button: 'aiStrategyButton', chat: 'aiStrategyChat' },
    { input: 'aiDocumentInput', button: 'aiDocumentButton', chat: 'aiDocumentChat' }
  ];
  
  assistantInputs.forEach(config => {
    const inputElement = document.getElementById(config.input);
    const buttonElement = document.getElementById(config.button);
    
    if (inputElement && buttonElement) {
      buttonElement.addEventListener('click', function() {
        if (inputElement.value.trim() === '') return;
        
        // Add user message
        addUserMessage(config.chat, inputElement.value);
        
        // Store message and clear input
        const userMessage = inputElement.value;
        inputElement.value = '';
        
        // Simulate AI response delay
        setTimeout(function() {
          // Generate AI response based on user message
          let response = generateAIResponse(userMessage, config.chat);
          addAssistantMessage(config.chat, response);
        }, 1000);
      });
      
      // Allow pressing Enter to send message
      inputElement.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          buttonElement.click();
        }
      });
    }
  });
}

/**
 * Generate AI response based on user message
 */
function generateAIResponse(message, chatId) {
  // Simple keyword-based responses
  const message_lower = message.toLowerCase();
  
  if (chatId === 'aiAssistantChat') {
    if (message_lower.includes('deadline')) {
      return 'This opportunity has a submission deadline of May 20, 2025. That gives you 14 days to prepare the proposal.';
    } else if (message_lower.includes('requirement') || message_lower.includes('qualif')) {
      return 'The key requirements include CMMC Level 3 certification, staff with active security clearances, and previous DHS contract experience. Your company meets all these requirements.';
    } else if (message_lower.includes('recommend') || message_lower.includes('suggest')) {
      return 'Based on your company profile and the requirements, I recommend focusing on the Cybersecurity Infrastructure Upgrade opportunity. It has the highest match score and aligns with your technical capabilities.';
    }
  } else if (chatId === 'aiStrategyChat') {
    if (message_lower.includes('price') || message_lower.includes('cost')) {
      return 'For this opportunity, I recommend a price point of $792,500, which is competitive while maintaining a healthy profit margin. This is about 5% below the expected maximum price point while still being positioned as a premium solution.';
    } else if (message_lower.includes('competitor') || message_lower.includes('competition')) {
      return 'Your main competition will likely be SecureTech Inc., who has a stronger brand and more resources, but charges higher prices. Emphasize your more personalized service and faster response times as key differentiators.';
    } else if (message_lower.includes('strength') || message_lower.includes('advantage')) {
      return 'Your key strengths for this bid are your previous successful DHS contracts, CMMC Level 3 certification, and specialized cybersecurity expertise. Emphasize your 100% on-time delivery record and 24/7 incident response capabilities.';
    }
  } else if (chatId === 'aiDocumentChat') {
    if (message_lower.includes('improve') || message_lower.includes('better')) {
      return 'To improve this document, I suggest adding more quantitative results from your previous DHS projects. For example, include metrics on system uptime, threat detection rates, or incident response times from your past projects.';
    } else if (message_lower.includes('compliance') || message_lower.includes('regulation')) {
      return 'You should emphasize your compliance with NIST 800-53 security controls and CMMC Level 3 certification. Also highlight your experience with FedRAMP requirements and your team\'s security clearances.';
    } else if (message_lower.includes('technical') || message_lower.includes('approach')) {
      return 'In the technical approach section, be more specific about your proprietary ThreatScan™ technology. Describe how it improves detection rates and reduces false positives compared to standard security solutions.';
    }
  }
  
  // Default responses if no keywords match
  const defaultResponses = [
    'I understand. Can you provide more details so I can give you a more specific recommendation?',
    'That\'s an important consideration. Based on your company profile, I suggest focusing on your technical expertise and past performance with similar projects.',
    'Good question. Looking at the opportunity requirements and your company strengths, I recommend highlighting your compliance certifications and experienced team members.',
    'Based on my analysis, that approach could work well. You might also want to consider emphasizing your innovative methodology and cost efficiency.'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * Add user message to chat
 */
function addUserMessage(chatId, message) {
  const chatElement = document.getElementById(chatId);
  if (!chatElement) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  
  chatElement.appendChild(messageDiv);
  scrollChatToBottom(chatElement);
}

/**
 * Add assistant message to chat
 */
function addAssistantMessage(chatId, message) {
  const chatElement = document.getElementById(chatId);
  if (!chatElement) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ai';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  
  chatElement.appendChild(messageDiv);
  scrollChatToBottom(chatElement);
}

/**
 * Scroll chat to bottom
 */
function scrollChatToBottom(chatElement) {
  chatElement.scrollTop = chatElement.scrollHeight;
}

/**
 * Initialize tab tracking
 */
function initTabTracking() {
  const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
  
  tabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', function(event) {
      // Track tab change
      const tabId = event.target.getAttribute('id');
      console.log('Tab changed to:', tabId);
      
      // Add appropriate AI messages based on tab
      if (tabId === 'analysis-tab') {
        setTimeout(() => {
          addAssistantMessage('aiStrategyChat', 'I\'ve analyzed this opportunity and found that you have a 78% chance of winning. Your technical capabilities are an excellent match, but resource availability is a concern. Would you like specific strategy recommendations?');
        }, 1000);
      } else if (tabId === 'document-tab') {
        setTimeout(() => {
          addAssistantMessage('aiDocumentChat', 'What type of document would you like me to help you create? I recommend starting with the Executive Summary to outline your overall approach.');
        }, 1000);
      }
    });
  });
}

/**
 * Initialize document generation
 */
function initDocumentGeneration() {
  // Template selection
  const templateSelect = document.getElementById('documentTemplate');
  if (templateSelect) {
    templateSelect.addEventListener('change', function() {
      console.log('Template changed to:', templateSelect.value);
    });
  }
}
