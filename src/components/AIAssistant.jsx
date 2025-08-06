import React, { useState, useRef, useEffect } from 'react';
import { transactionService } from '../services/transaction';
import './AIAssistant.css';

const AIAssistant = ({ userContext = '', onCategorySelect = null }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Hi! I\'m your PennyPal AI assistant. How can I help you with your finances today? 💰', timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const result = await transactionService.getFinancialAdvice(userMessage, userContext);
      const botResponse = result.success ? result.data.message : 'Sorry, I could not process your request at the moment.';
      
      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: botResponse, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, there was an error connecting to the AI assistant.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorizeExpense = async (description) => {
    if (!description.trim()) return;

    setLoading(true);
    try {
      const result = await transactionService.categorizeExpenseAI(description);
      if (result.success && onCategorySelect) {
        onCategorySelect(result.data.category);
        setResponse(`Suggested category: ${result.data.category}`);
      }
    } catch (error) {
      setResponse('Could not categorize the expense.');
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    { text: "💰 How can I save more money?", icon: "💰" },
    { text: "📊 What's a good budgeting strategy?", icon: "📊" },
    { text: "🍽️ How much should I spend on food?", icon: "🍽️" },
    { text: "✂️ Tips for reducing expenses?", icon: "✂️" },
    { text: "🏦 Emergency fund advice?", icon: "🏦" },
    { text: "💳 How to manage debt?", icon: "💳" }
  ];

  const handleQuickQuestion = async (question) => {
    setMessage(question.text);
    await handleSendMessage();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`ai-toggle-btn ${isOpen ? 'open' : ''}`}
      >
        <div className="ai-toggle-icon">
          {isOpen ? '✕' : '🤖'}
        </div>
        {!isOpen && <div className="ai-pulse-ring"></div>}
        <div className="ai-notification-dot"></div>
      </button>

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-avatar">
              <div className="ai-avatar-inner">🤖</div>
              <div className="ai-status-dot"></div>
            </div>
            <div className="ai-header-info">
              <h3>PennyPal AI</h3>
              <span className="ai-status">Online</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="ai-close-btn">
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="ai-messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.type}`}>
                {msg.type === 'bot' && (
                  <div className="ai-message-avatar">🤖</div>
                )}
                <div className="ai-message-content">
                  <div className="ai-message-bubble">
                    {msg.content}
                  </div>
                  <div className="ai-message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.type === 'user' && (
                  <div className="ai-message-avatar user">👤</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="ai-message bot">
                <div className="ai-message-avatar">🤖</div>
                <div className="ai-message-content">
                  <div className="ai-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="ai-quick-questions">
            <div className="ai-quick-title">💡 Quick questions:</div>
            <div className="ai-quick-grid">
              {quickQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="ai-quick-btn"
                  disabled={loading}
                >
                  <span className="ai-quick-icon">{question.icon}</span>
                  <span className="ai-quick-text">{question.text.replace(/^[^\s]+\s/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="ai-input-container">
            <div className="ai-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your financial question..."
                className="ai-input"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
                className="ai-send-btn"
              >
                {loading ? (
                  <div className="ai-loading-spinner"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;