import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Plus,
  Calendar,
  Clock,
  X,
  Send
} from 'lucide-react';
import { Meeting } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

interface MeetingsViewProps {
  initialRoomCode?: string;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ initialRoomCode }) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(initialRoomCode || null);
  const [loading, setLoading] = useState(true);

  // Scheduling Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [meetingStart, setMeetingStart] = useState('');
  const [meetingEnd, setMeetingEnd] = useState('');

  // Call states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [callChatMessages, setCallChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [callChatInput, setCallChatInput] = useState('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    if (activeCallRoom) {
      startMedia();
      const socket = getSocket();
      socket.emit('join_meeting', {
        room_code: activeCallRoom,
        user: { id: user?.id, full_name: user?.full_name, role: user?.role },
      });

      return () => {
        stopMedia();
        socket.emit('leave_meeting', { room_code: activeCallRoom });
      };
    }
  }, [activeCallRoom]);

  const loadMeetings = async () => {
    try {
      const res = await api.getMeetings();
      setMeetings(res.meetings || []);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera/mic access was not granted or not supported:', err);
    }
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error('Screen share error:', err);
      }
    } else {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    }
  };

  const handleSendCallChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callChatInput.trim()) return;
    setCallChatMessages((prev) => [
      ...prev,
      {
        sender: user?.full_name || 'Me',
        text: callChatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCallChatInput('');
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle) return;
    try {
      const res = await api.createMeeting({
        title: meetingTitle,
        description: meetingDesc,
        scheduled_start: meetingStart || undefined,
        scheduled_end: meetingEnd || undefined,
      });
      setMeetings([res.meeting, ...meetings]);
      setShowScheduleModal(false);
      setMeetingTitle('');
      setMeetingDesc('');
    } catch (err: any) {
      alert(err.message || 'Error scheduling meeting');
    }
  };

  if (activeCallRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-page">
        {/* Call bar */}
        <div className="h-14 px-6 bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <h2 className="text-card-title text-text-main font-semibold">Live Conference</h2>
            <span className="text-secondary text-text-muted">&middot; Room {activeCallRoom}</span>
          </div>
          <button
            onClick={() => setActiveCallRoom(null)}
            className="btn-danger btn-sm"
          >
            <PhoneOff size={14} /> Leave call
          </button>
        </div>

        {/* Video stage and in-call chat */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[1000px] flex-1 max-h-[560px]">
              {/* Local Video */}
              <div className="bg-surface border border-border rounded-[10px] overflow-hidden flex items-center justify-center relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="text-center p-6">
                    <div className="w-14 h-14 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-semibold text-lg mx-auto mb-2">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-body font-medium text-text-main">{user?.full_name}</div>
                    <div className="text-secondary text-text-muted mt-0.5">Camera off</div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-surface/90 border border-border px-2.5 py-1 rounded-[6px] text-[12px] font-medium text-text-main">
                  {user?.full_name} (You)
                </div>
              </div>

              {/* Simulated Remote Peer */}
              <div className="bg-surface border border-border rounded-[10px] overflow-hidden flex items-center justify-center relative">
                <div className="text-center p-6">
                  <div className="w-14 h-14 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center font-semibold text-lg mx-auto mb-2">
                    S
                  </div>
                  <div className="text-body font-medium text-text-main">Sarah Jenkins</div>
                  <div className="text-secondary text-text-muted mt-0.5">Lead Presenter</div>
                </div>
                <div className="absolute bottom-3 left-3 bg-surface/90 border border-border px-2.5 py-1 rounded-[6px] text-[12px] font-medium text-text-main">
                  Sarah Jenkins
                </div>
              </div>
            </div>
          </div>

          {/* In-Call Chat Drawer */}
          {showInCallChat && (
            <div className="w-80 bg-surface border-l border-border flex flex-col shrink-0">
              <div className="h-14 px-4 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-card-title text-text-main">In-Call Chat</span>
                <button
                  onClick={() => setShowInCallChat(false)}
                  className="p-1 text-text-muted hover:text-text-main rounded"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {callChatMessages.length === 0 ? (
                  <div className="text-center text-text-muted text-secondary py-12">
                    No messages yet in this call.
                  </div>
                ) : (
                  callChatMessages.map((m, i) => (
                    <div key={i} className="text-secondary">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-main text-[12px]">{m.sender}</span>
                        <span className="text-[10px] text-text-muted">{m.time}</span>
                      </div>
                      <div className="text-body text-text-main mt-1 bg-page p-2.5 rounded-[8px] border border-border leading-relaxed text-[13px]">
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendCallChat} className="p-3 border-t border-border flex gap-2">
                <input
                  type="text"
                  className="ui-input flex-1 h-9 text-[13px]"
                  placeholder="Chat with participants..."
                  value={callChatInput}
                  onChange={(e) => setCallChatInput(e.target.value)}
                />
                <button type="submit" className="btn-accent btn-sm h-9 px-3">
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Controls footer */}
        <div className="h-16 bg-surface border-t border-border flex items-center justify-center gap-3">
          <button
            onClick={toggleMic}
            className={`btn-sm ${isAudioMuted ? 'btn-danger' : 'btn-outlined'}`}
          >
            {isAudioMuted ? <MicOff size={15} /> : <Mic size={15} />}
            <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={toggleVideo}
            className={`btn-sm ${isVideoOff ? 'btn-danger' : 'btn-outlined'}`}
          >
            {isVideoOff ? <VideoOff size={15} /> : <Video size={15} />}
            <span>{isVideoOff ? 'Start video' : 'Stop video'}</span>
          </button>
          <button
            onClick={toggleScreenShare}
            className={`btn-sm ${isScreenSharing ? 'btn-accent' : 'btn-outlined'}`}
          >
            <Monitor size={15} />
            <span>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</span>
          </button>
          <button
            onClick={() => setShowInCallChat(!showInCallChat)}
            className={`btn-sm ${showInCallChat ? 'btn-accent' : 'btn-outlined'}`}
          >
            <MessageSquare size={15} />
            <span>Chat</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main font-semibold">
            Meetings & Conferences
          </h1>
          <p className="text-secondary text-text-muted mt-1">
            Schedule and launch secure peer-to-peer video meetings and team reviews
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="btn-accent"
        >
          <Plus size={16} /> Schedule meeting
        </button>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.length === 0 ? (
          <div className="col-span-full ui-card text-center py-12">
            <div className="text-body text-text-muted">No meetings scheduled.</div>
            <div className="text-secondary text-text-muted mt-1">Click "Schedule meeting" above to plan a new conference.</div>
          </div>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="ui-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-secondary mb-3">
                  <span className="badge badge-in_progress">{m.status}</span>
                  <span className="text-text-muted font-mono text-[12px]">{m.room_code}</span>
                </div>
                <h3 className="text-card-title text-text-main font-semibold mb-2">
                  {m.title}
                </h3>
                <p className="text-secondary text-text-muted line-clamp-2 mb-4 leading-relaxed">
                  {m.description || 'Sprint sync and team architecture review.'}
                </p>
                <div className="text-secondary text-text-muted space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-muted" />
                    <span>
                      {m.scheduled_start
                        ? new Date(m.scheduled_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : 'Scheduled'}
                    </span>
                  </div>
                  <div>Host: {m.host?.full_name || 'Team Lead'}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-secondary text-text-muted">Virtual Room</span>
                <button
                  onClick={() => setActiveCallRoom(m.room_code)}
                  className="btn-accent btn-sm"
                >
                  <Video size={14} /> Join call
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-card-title text-text-main font-semibold">Schedule Meeting</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-text-muted hover:text-text-main rounded"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  className="ui-input w-full"
                  placeholder="e.g. Sprint 2 Planning & Review"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Agenda & Description
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-surface border border-border rounded-[8px] p-2.5 text-body text-text-main outline-none focus:border-accent"
                  placeholder="Topics, agendas, and pre-reads..."
                  value={meetingDesc}
                  onChange={(e) => setMeetingDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-secondary font-medium text-text-main mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className="ui-input w-full"
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-secondary font-medium text-text-main mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    className="ui-input w-full"
                    value={meetingEnd}
                    onChange={(e) => setMeetingEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-outlined"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
