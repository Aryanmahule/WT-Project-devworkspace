import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Hash,
  Send,
  Plus,
  Trash2,
  Lock,
  X
} from 'lucide-react';
import { Channel, Message } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      const socket = getSocket();
      socket.emit('join_channel', { channel_id: selectedChannel.id, user_id: user?.id });

      const handleNewMessage = (msg: Message) => {
        if (msg.channel_id === selectedChannel.id) {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
        }
      };

      const handleUserTyping = (data: { user_id: number; user_name: string; is_typing: boolean }) => {
        if (data.is_typing) {
          setTypingUsers((prev) => Array.from(new Set([...prev, data.user_name])));
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== data.user_name));
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);

      return () => {
        socket.emit('leave_channel', { channel_id: selectedChannel.id, user_id: user?.id });
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
      };
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      const res = await api.getChannels();
      setChannels(res.channels || []);
      if (res.channels?.length > 0) {
        setSelectedChannel(res.channels[0]);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  const loadMessages = async (channelId: number) => {
    try {
      const res = await api.getMessages(channelId);
      setMessages(res.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel || !user) return;

    const socket = getSocket();
    socket.emit('send_message', {
      channel_id: selectedChannel.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    socket.emit('typing', {
      channel_id: selectedChannel.id,
      user_id: user.id,
      user_name: user.full_name,
      is_typing: false,
    });

    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!selectedChannel || !user) return;

    const socket = getSocket();
    socket.emit('typing', {
      channel_id: selectedChannel.id,
      user_id: user.id,
      user_name: user.full_name,
      is_typing: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        channel_id: selectedChannel.id,
        user_id: user.id,
        user_name: user.full_name,
        is_typing: false,
      });
    }, 2000);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const res = await api.createChannel({
        name: newChannelName.trim(),
        description: newChannelDesc,
        is_private: newChannelPrivate,
      });
      setChannels([...channels, res.channel]);
      setSelectedChannel(res.channel);
      setShowCreateModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
    } catch (err: any) {
      alert(err.message || 'Error creating channel');
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apex_token')}`,
        },
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, is_deleted: true, content: '[Message deleted]' } : m))
        );
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-page">
      {/* Channels Sidebar */}
      <div className="w-64 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          <div className="font-semibold text-card-title text-text-main flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            <span>Channels</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-outlined btn-sm p-1.5"
            title="Create Channel"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase px-3 py-2">
            Workspace Channels
          </div>
          {channels.map((ch) => {
            const isSelected = selectedChannel?.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-secondary text-left font-medium transition-colors ${
                  isSelected
                    ? 'bg-accent-subtle text-accent'
                    : 'text-text-muted hover:text-text-main hover:bg-page'
                }`}
              >
                {ch.is_private ? <Lock size={14} /> : <Hash size={14} />}
                <span className="truncate flex-1">{ch.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-page">
        {/* Chat Room Header */}
        <div className="h-14 px-6 bg-surface border-b border-border flex items-center justify-between shrink-0">
          <div>
            <div className="font-semibold text-card-title text-text-main flex items-center gap-1.5">
              <Hash size={16} className="text-accent" />
              <span>{selectedChannel?.name || 'Channel'}</span>
            </div>
            <div className="text-secondary text-text-muted text-[12px] truncate max-w-md">
              {selectedChannel?.description || 'Team channel conversation'}
            </div>
          </div>
          <div className="flex items-center gap-2 text-secondary text-text-muted text-[12px]">
            <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
            <span>Connected</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-40 text-text-muted" />
              <div className="text-body font-medium text-text-main">Welcome to #{selectedChannel?.name}!</div>
              <div className="text-secondary mt-1">This is the start of this channel. Post the first message below.</div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className="flex gap-3 items-start group">
                  <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-semibold text-[13px] shrink-0 mt-0.5">
                    {msg.sender?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[13px] text-text-main">
                        {msg.sender?.full_name}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      {(isMe || user?.role === 'platform_admin') && !msg.is_deleted && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger p-0.5 transition-opacity"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div
                      className={`text-body leading-relaxed inline-block max-w-[85%] rounded-[8px] p-3 border ${
                        isMe
                          ? 'bg-surface border-border text-text-main'
                          : 'bg-surface border-border text-text-main'
                      } ${msg.is_deleted ? 'italic text-text-muted' : ''}`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-1 text-[11px] text-text-muted italic bg-page">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-surface border-t border-border flex gap-3 items-center shrink-0"
        >
          <input
            type="text"
            className="ui-input flex-1"
            placeholder={`Message #${selectedChannel?.name || 'channel'}...`}
            value={newMessage}
            onChange={handleInputChange}
          />
          <button type="submit" className="btn-accent px-5">
            <Send size={15} /> Send
          </button>
        </form>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-card-title text-text-main font-semibold">Create New Channel</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-text-muted hover:text-text-main rounded"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  className="ui-input w-full"
                  placeholder="e.g. backend-discussions"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  className="ui-input w-full"
                  placeholder="Topic or project purpose"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={newChannelPrivate}
                  onChange={(e) => setNewChannelPrivate(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="is_private" className="text-secondary text-text-main cursor-pointer select-none">
                  Make this channel private to invited members
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outlined"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
