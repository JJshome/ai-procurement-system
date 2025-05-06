/**
 * AI-Powered Procurement System Demo
 * Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Tab Navigation Tracking
  const demoTabs = document.querySelectorAll('#demoTabs button');
  demoTabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', event => {
      console.log(`Navigation to tab: ${event.target.id}`);
      // Here you could add analytics tracking or other events
    });
  });
  
  // Handle Form Submissions
  setupOpportunitySearch();
  setupDocumentGeneration();
  
  // Setup AI Chat Assistants
  setupChatAssistants();
  
  // Setup Opportunity Details Viewer
  setupOpportunityViewer();
  
  // Task List Checkboxes
  setupTaskList();
});

/**
 * Setup Opportunity Search Form
 */
function setupOpportunitySearch() {
  const searchForm = document.getElementById('opportunitySearchForm');
  if (!searchForm) return;
  
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const spinner = document.getElementById('searchSpinner');
    const button = document.getElementById('searchButton');
    
    // Show loading state
    spinner.classList.remove('d-none');
    button.disabled = true;
    
    // Simulate search delay
    setTimeout(() => {
      // Reset loading state
      spinner.classList.add('d-none');
      button.disabled = false;
      
      // In a real application, this would filter the results based on search criteria
      console.log('Search performed with criteria:', {
        keywords: document.getElementById('searchKeywords').value,
        category: document.getElementById('searchCategory').value,
        agency: document.getElementById('searchAgency').value,
        value: document.getElementById('searchValue').value
      });
      
      // For demo purposes, we just show the existing results
      // You would typically update the opportunities list here
    }, 1000);
  });
}

/**
 * Setup Document Generation
 */
function setupDocumentGeneration() {
  const documentForm = document.getElementById('documentGenerationForm');
  if (!documentForm) return;
  
  documentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const spinner = document.getElementById('generateSpinner');
    const button = document.getElementById('generateButton');
    
    // Show loading state
    spinner.classList.remove('d-none');
    button.disabled = true;
    
    // Simulate document generation
    setTimeout(() => {
      document.getElementById('documentPlaceholder').classList.add('d-none');
      document.getElementById('documentContent').classList.remove('d-none');
      
      // In a real application, the content would be dynamically generated based on form settings
      console.log('Document generated with settings:', {
        template: document.getElementById('documentTemplate').value,
        format: document.getElementById('documentFormat').value,
        language: document.getElementById('documentLanguage').value,
        emphasizeStrengths: document.getElementById('emphasizeStrengths').checked,
        includeExamples: document.getElementById('includeExamples').checked,
        includeAnalysis: document.getElementById('includeAnalysis').checked,
        customInstructions: document.getElementById('customInstructions').value
      });
      
      // Reset loading state
      spinner.classList.add('d-none');
      button.disabled = false;
    }, 2000);
  });
}

/**
 * Setup AI Chat Assistants
 */
function setupChatAssistants() {
  // Define the chat IDs and their respective inputs and buttons
  const aiChats = [
    {
      chatId: 'aiAssistantChat',
      inputId: 'aiAssistantInput',
      buttonId: 'aiAssistantButton',
      responseType: 'assistant'
    },
    {
      chatId: 'aiStrategyChat',
      inputId: 'aiStrategyInput',
      buttonId: 'aiStrategyButton',
      responseType: 'strategy'
    },
    {
      chatId: 'aiDocumentChat',
      inputId: 'aiDocumentInput',
      buttonId: 'aiDocumentButton',
      responseType: 'document'
    }
  ];
  
  // Setup event listeners for each chat
  aiChats.forEach(chat => {
    const button = document.getElementById(chat.buttonId);
    const input = document.getElementById(chat.inputId);
    
    if (!button || !input) return;
    
    // Button click handler
    button.addEventListener('click', function() {
      const message = input.value.trim();
      
      if (message) {
        appendUserMessage(chat.chatId, message);
        input.value = '';
        
        // Simulate AI response
        setTimeout(() => {
          const aiResponse = getAIResponse(chat.responseType, message);
          appendAiMessage(chat.chatId, aiResponse);
        }, 1000);
      }
    });
    
    // Enter key handler
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        button.click();
      }
    });
  });
}

/**
 * Get AI response based on the type and user message
 */
function getAIResponse(type, userMessage) {
  // In a real application, this would call an AI API
  const responses = {
    assistant: [
      "I'll help you find relevant opportunities. Based on your company profile, I recommend focusing on cybersecurity contracts with DHS where you have a strong track record.",
      "Looking at your search criteria, I suggest adding 'threat detection' to your keywords to find more specialized opportunities.",
      "Based on your past performance, you have a competitive advantage in projects requiring security clearances. Would you like me to filter for those?"
    ],
    strategy: [
      "To maximize your chances of winning, I suggest emphasizing your AI-powered threat detection technology and your past performance with similar DHS projects.",
      "Your pricing strategy looks good, but I recommend highlighting the value-add of your 24/7 SOC operations, which exceeds the requirements.",
      "The competition analysis shows that you have a unique advantage with your CMMC Level 3 certification. Make sure to emphasize this in your proposal."
    ],
    document: [
      "I'll create a proposal that highlights your unique strengths. Your 99.8% threat detection rate and previous DHS projects will be prominently featured in the executive summary.",
      "For this technical proposal, I recommend including a detailed architecture diagram showing your multi-layered security approach.",
      "Would you like me to add more details about your past performance with the CISA project? It appears to be very relevant to this opportunity."
    ]
  };
  
  // Select a random response based on type
  const typeResponses = responses[type] || responses.assistant;
  return typeResponses[Math.floor(Math.random() * typeResponses.length)];
}

/**
 * Append a user message to the chat
 */
function appendUserMessage(chatId, message) {
  const chat = document.getElementById(chatId);
  if (!chat) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  chat.appendChild(messageDiv);
  chat.scrollTop = chat.scrollHeight;
}

/**
 * Append an AI message to the chat
 */
function appendAiMessage(chatId, message) {
  const chat = document.getElementById(chatId);
  if (!chat) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ai';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  chat.appendChild(messageDiv);
  chat.scrollTop = chat.scrollHeight;
}

/**
 * Setup Opportunity Details Viewer
 */
function setupOpportunityViewer() {
  const detailButtons = document.querySelectorAll('.opportunity-select');
  const closeButton = document.getElementById('closeOpportunityDetails');
  const detailsPanel = document.getElementById('opportunityDetails');
  
  if (!detailsPanel) return;
  
  // Show details when an opportunity is selected
  detailButtons.forEach(button => {
    button.addEventListener('click', function() {
      const opportunityId = this.getAttribute('data-id');
      console.log(`Selected opportunity: ${opportunityId}`);
      
      // In a real application, this would load the details from a database
      // For demo purposes, we simply show the existing details panel
      detailsPanel.classList.remove('d-none');
      
      // Scroll to the details panel
      detailsPanel.scrollIntoView({ behavior: 'smooth' });
    });
  });
  
  // Hide details when close button is clicked
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      detailsPanel.classList.add('d-none');
    });
  }
}

/**
 * Setup Task List
 */
function setupTaskList() {
  const taskCheckboxes = document.querySelectorAll('#taskList input[type="checkbox"]');
  
  taskCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const label = this.nextElementSibling;
      
      if (this.checked) {
        label.classList.add('text-decoration-line-through');
      } else {
        label.classList.remove('text-decoration-line-through');
      }
      
      // In a real application, this would update the task status in a database
      console.log(`Task ${this.id} ${this.checked ? 'completed' : 'pending'}`);
    });
  });
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
