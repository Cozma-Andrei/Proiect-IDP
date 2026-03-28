import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

interface ConversationPartner {
  userId: string;
  username: string;
  lastMessage: {
    content: string;
    sentAt: string;
    isIncoming: boolean;
  };
  details: any;
}

const MessagesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [activeContactDetails, setActiveContactDetails] = useState<any>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<number | null>(null);

  // Check URL query parameters for a specific user to chat with
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const preselectedUserId = searchParams.get('userId');
    if (preselectedUserId) {
      setActivePartnerId(preselectedUserId);
      // Clean URL without reloading page
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  // Fetch all conversation contacts and list of all doctors
  const fetchConversations = async () => {
    try {
      const response = await api.get('/message/conversations');
      setConversations(response.data.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchDoctorList = async () => {
    try {
      const response = await api.get('/doctor/all');
      setDoctorsList(response.data.doctors || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchDoctorList();
  }, []);

  // Fetch active conversation messages
  const fetchMessages = async (partnerId: string, background = false) => {
    if (!background) setLoadingConv(true);
    try {
      const response = await api.get(`/message/conversation/${partnerId}`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!background) setLoadingConv(false);
    }
  };

  // Handle selecting a conversation
  useEffect(() => {
    if (activePartnerId) {
      // In case we navigated via URL and the partner isn't in our active conversations list
      const existingPartner = conversations.find(c => c.userId === activePartnerId);
      if (existingPartner) {
        setActiveContactDetails({
          username: existingPartner.username,
          details: existingPartner.details
        });
      } else if (activePartnerId !== 'ME') {
        api.get(`/message/contact/${activePartnerId}`).then(res => {
          setActiveContactDetails({
            username: res.data.username,
            details: res.data.details
          });
          
          setConversations(prev => {
            if (prev.some(c => c.userId === activePartnerId)) return prev;
            return [{
              userId: res.data.userId,
              username: res.data.username,
              details: res.data.details,
              lastMessage: { content: '...', sentAt: new Date().toISOString(), isIncoming: false }
            }, ...prev];
          });
        }).catch(err => {
          console.error("Could not fetch new contact details", err);
          setActiveContactDetails(null);
        });
      }

      fetchMessages(activePartnerId);
      
      // Setup polling for the active chat
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = window.setInterval(() => {
        fetchMessages(activePartnerId, true);
        // Refresh conversations list silently too
        fetchConversations();
      }, 5000);
      
    } else {
      setMessages([]);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activePartnerId]);

  // Scroll to bottom when messages update (only if count changes)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;

    try {
      const response = await api.post('/message', {
        receiverId: activePartnerId,
        content: newMessage.trim(),
      });
      
      const sentMsg = {
        _id: response.data.sentMessage.id,
        senderId: 'ME', // any string not equal to activePartnerId works for optimistic UI
        receiverId: activePartnerId,
        content: response.data.sentMessage.content,
        isRead: false,
        sentAt: response.data.sentMessage.sentAt,
      };

      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
      fetchConversations(); // refresh the sidebar
      
      // Automatically scroll down
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Eroare la trimiterea mesajului.');
    }
  };

  const doctorFromList = doctorsList.find(doc => doc.userAccountId === activePartnerId);
  
  const activeDisplayName = activeContactDetails?.details?.firstName 
    ? `${activeContactDetails.details.firstName} ${activeContactDetails.details.lastName}`
    : activeContactDetails?.username 
    || (doctorFromList ? `Dr. ${doctorFromList.firstName} ${doctorFromList.lastName}` : 'Se încarcă...');
    
  const activeSpecialization = activeContactDetails?.details?.specialization || doctorFromList?.specialization;
  const activeInitial = activeContactDetails?.details?.firstName?.[0] || activeContactDetails?.username?.[0] || doctorFromList?.firstName?.[0] || '?';

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden flex h-[75vh]">
      {/* Sidebar - Liste de conversații */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Mesaje</h2>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl hover:bg-blue-200 transition"
            title="Începe o conversație nouă"
          >
            +
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Nicio conversație activă.
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.userId}
                onClick={() => setActivePartnerId(conv.userId)}
                className={`p-4 border-b cursor-pointer transition select-none ${activePartnerId === conv.userId ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800 truncate">
                    {conv.details?.firstName ? `${conv.details.firstName} ${conv.details.lastName}` : conv.username}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <p className="text-gray-500 truncate mr-2">
                    {conv.lastMessage.isIncoming ? '' : 'Tu: '} {conv.lastMessage.content}
                  </p>
                  {conv.details?.role === 'Doctor' && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">DR</span>
                  )}
                  {conv.details?.role === 'Patient' && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">PACIENT</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50 relative">
        {activePartnerId ? (
          <>
            {/* Header Conversatie */}
            <div className="p-4 bg-white border-b flex items-center shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                {activeInitial}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">
                  {activeDisplayName}
                </h3>
                {activeSpecialization && (
                  <p className="text-xs text-blue-600 font-medium">{activeSpecialization}</p>
                )}
              </div>
            </div>

            {/* Lista Mesaje */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingConv ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-gray-400">Se încarcă mesajele...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center p-6">
                  <span className="bg-gray-200 text-gray-500 rounded-full p-4 mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  </span>
                  <p className="text-gray-500 font-medium">Scrie un mesaj pentru a începe conversația.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // user from context has its _id mapped to `user.userId`? Let's assume standard jwt mapping gives userId or _id. Since our token generation does `userId: user._id`, it is likely `user?.userId`.
                  // wait, we can just check if senderId !== activePartnerId
                  const isMine = msg.senderId !== activePartnerId;
                  const showDate = idx === 0 || new Date(msg.sentAt).toDateString() !== new Date(messages[idx - 1].sentAt).toDateString();

                  return (
                    <React.Fragment key={msg._id}>
                      {showDate && (
                        <div className="flex justify-center mt-4 mb-2">
                          <span className="bg-gray-200/60 text-gray-500 text-xs px-2 py-1 rounded-md">
                            {new Date(msg.sentAt).toLocaleDateString('ro-RO', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.sentAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Input Zona */}
            <div className="p-3 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrieți un mesaj..."
                  className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full px-4 py-2 border outline-none text-sm transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center transition shadow-sm"
                >
                  <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p className="text-lg font-medium text-gray-600">Selectați o conversație din listă</p>
            <p className="text-sm mt-2 max-w-xs text-center">
              Pentru a iniția o discuție cu un medic, apăsați pe butonul <strong className="text-blue-500 font-bold border border-blue-200 rounded px-1">+</strong> din panoul de contacte.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal for starting conversations */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Inițiază o Conversație Nouă</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-4">Alegeți din lista de medici verificați ai platformei:</p>
              
              {doctorsList.length === 0 ? (
                <p className="text-gray-500 text-center italic py-4">Nu există medici înregistrați.</p>
              ) : (
                <div className="space-y-2">
                  {doctorsList.map(doc => (
                    <div key={doc._id} className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                      <div>
                        <p className="font-semibold text-gray-800">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-xs text-blue-600">{doc.specialization}</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (doc.userAccountId) {
                            setActivePartnerId(doc.userAccountId);
                            setShowNewChatModal(false);
                          } else {
                            alert("Acest medic nu are contul configurat complet (lipsește ID-ul intern).");
                          }
                        }}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-200"
                      >
                        Selectează
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {role === 'Doctor' && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center">
                  <p className="text-xs text-gray-400 mb-2">Doriți să scrieți unui pacient?</p>
                  <button 
                    onClick={() => navigate('/doctor/patient')}
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-semibold transition"
                  >
                    Caută în baza de pacienți (CNP)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
