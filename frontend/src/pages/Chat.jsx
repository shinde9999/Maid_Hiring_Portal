import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import "./Chat.css";

function Chat() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch active contacts list
  const fetchContacts = async () => {
    try {
      const res = await API.get("/chat/contacts");
      setContacts(res.data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  };

  // Search for new contacts
  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await API.get(`/chat/search?q=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Error searching contacts:", err);
    }
  };

  // Fetch messages between current user and active contact
  const fetchMessages = async (contactId) => {
    if (!contactId) return;
    try {
      const res = await API.get(`/chat/messages/${contactId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Poll for new messages every 4 seconds when a contact is selected
  useEffect(() => {
    if (!activeContact) return;

    fetchMessages(activeContact.id);
    const interval = setInterval(() => {
      fetchMessages(activeContact.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeContact]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectContact = (contact) => {
    setActiveContact(contact);
    setSearchQuery("");
    setSearchResults([]);
    setMessages([]);
    setLoadingMessages(true);
    fetchMessages(contact.id).finally(() => setLoadingMessages(false));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    const msgText = newMessage.trim();
    setNewMessage("");

    // Optimistic UI update
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: activeContact.id,
      message: msgText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await API.post("/chat/messages", {
        receiverId: activeContact.id,
        message: msgText
      });
      // Update with database values
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
      // Refresh contacts list to move contact to top / ensure listed
      fetchContacts();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  // Normalize avatar image URLs
  const getAvatarUrl = (targetUser) => {
    let url = targetUser.photo_url || targetUser.photoUrl || "";
    if (url && url.startsWith("/")) {
      try {
        const apiBase = API.defaults.baseURL.replace(/\/api\/?$/, "");
        return apiBase + url;
      } catch (e) { /* ignore */ }
    }
    return url;
  };

  return (
    <div className="chat-page">
      <Navbar />
      <div className="chat-layout">
        
        {/* Left contacts sidebar */}
        <div className="chat-sidebar">
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search people to chat..."
              value={searchQuery}
              onChange={handleSearch}
              className="chat-search-input"
            />
          </div>

          <div className="contacts-list-container">
            {searchQuery.trim() ? (
              <div className="search-results-list">
                <div className="list-section-header">Search Results</div>
                {searchResults.length === 0 ? (
                  <div className="no-contacts-found">No users found</div>
                ) : (
                  searchResults.map((contact) => (
                    <div
                      key={contact.id}
                      className="contact-card search-card"
                      onClick={() => selectContact(contact)}
                    >
                      {getAvatarUrl(contact) ? (
                        <div className="chat-avatar">
                          <img src={getAvatarUrl(contact)} alt={contact.name} />
                        </div>
                      ) : (
                        <div className="chat-avatar-placeholder">👤</div>
                      )}
                      <div className="contact-details">
                        <div className="contact-name">{contact.name}</div>
                        <div className="contact-role">{contact.role}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="active-contacts-list">
                <div className="list-section-header">Recent Messages</div>
                {contacts.length === 0 ? (
                  <div className="no-recent-contacts">
                    No active chats. Use the search bar above to find a maid or client and start talking!
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`contact-card ${activeContact?.id === contact.id ? "active" : ""}`}
                      onClick={() => selectContact(contact)}
                    >
                      {getAvatarUrl(contact) ? (
                        <div className="chat-avatar">
                          <img src={getAvatarUrl(contact)} alt={contact.name} />
                        </div>
                      ) : (
                        <div className="chat-avatar-placeholder">👤</div>
                      )}
                      <div className="contact-details">
                        <div className="contact-name">{contact.name}</div>
                        <span className={`role-pill ${contact.role}`}>{contact.role}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right chat panel */}
        <div className="chat-main-pane">
          {activeContact ? (
            <>
              <div className="chat-pane-header">
                {getAvatarUrl(activeContact) ? (
                  <div className="chat-avatar">
                    <img src={getAvatarUrl(activeContact)} alt={activeContact.name} />
                  </div>
                ) : (
                  <div className="chat-avatar-placeholder">👤</div>
                )}
                <div className="active-contact-info">
                  <h3>{activeContact.name}</h3>
                  <p>{activeContact.email} • <span className="capitalize">{activeContact.role}</span></p>
                </div>
              </div>

              <div className="chat-messages-container">
                {loadingMessages ? (
                  <div className="messages-loading">Loading message history...</div>
                ) : messages.length === 0 ? (
                  <div className="no-messages-start">
                    👋 This is the start of your message history with {activeContact.name}. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`message-bubble-wrapper ${isOwn ? "own" : "their"}`}>
                        <div className="message-bubble">
                          <p className="message-text">{msg.message}</p>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Type a message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="chat-compose-input"
                  required
                />
                <button type="submit" className="chat-send-btn">
                  Send ✉️
                </button>
              </form>
            </>
          ) : (
            <div className="chat-pane-empty">
              <div className="chat-empty-icon">💬</div>
              <h2>Select a Chat to Start Messaging</h2>
              <p>Search for a user in the left panel, or click on an existing conversation to view and send messages.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Chat;
