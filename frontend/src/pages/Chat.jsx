import React, { useEffect, useState, useRef } from 'react';
import { API_BASE } from '../config';


export default function Chat({ token, user, partnerData, setPartnerData }) {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all chat contacts
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);

        // If partnerData was passed in from details view, ensure they are in contacts or we select them
        if (partnerData && !data.some(c => c.partner_id === partnerData.partner_id)) {
          setContacts(prev => [partnerData, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch messages with the selected partner
  const fetchMessages = async (partnerId) => {
    if (!partnerId) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [token, partnerData]);

  // Handle active conversation selection & polling
  useEffect(() => {
    if (partnerData?.partner_id) {
      setLoadingMessages(true);
      fetchMessages(partnerData.partner_id).finally(() => setLoadingMessages(false));

      // Setup Polling every 3 seconds for new messages
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        fetchMessages(partnerData.partner_id);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [partnerData?.partner_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !partnerData?.partner_id) return;

    const payload = {
      receiver_id: partnerData.partner_id,
      message_text: messageText.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        setMessageText('');
        // Refresh contacts to bubble active chats to top
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Chat Messenger</h1>

      <div className="chat-container glass-panel">
        {/* Left column: contacts */}
        <div className="chat-sidebar">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Conversations</h3>
          </div>

          {loadingContacts ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : contacts.length > 0 ? (
            <div style={{ overflowY: 'auto', flexGrow: 1 }}>
              {contacts.map(c => (
                <div 
                  key={c.partner_id}
                  className={`chat-partner-item ${partnerData?.partner_id === c.partner_id ? 'active' : ''}`}
                  onClick={() => setPartnerData(c)}
                >
                  <div className="chat-partner-name">{c.partner_name}</div>
                  <div className="chat-partner-role">{c.partner_email}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No active conversations yet. Find a pet and contact the owner!
            </div>
          )}
        </div>

        {/* Right column: active chat area */}
        <div className="chat-viewport">
          {partnerData?.partner_id ? (
            <>
              {/* Active partner bar */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{partnerData.partner_name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{partnerData.partner_email}</span>
              </div>

              {/* Message viewport */}
              <div className="chat-messages">
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-secondary)' }}>
                    Loading message history...
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map(m => {
                      const isSentByMe = m.sender_id === user.user_id;
                      return (
                        <div 
                          key={m.message_id}
                          className={`chat-message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                        >
                          <div>{m.message_text}</div>
                          <span className="chat-message-time">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                    No messages yet. Send a greeting to start the conversation!
                  </div>
                )}
              </div>

              {/* Message entry bar */}
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required 
                />
                <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</span>
              <p>Select a contact from the sidebar to view chat history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
