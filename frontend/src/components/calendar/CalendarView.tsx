import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  X
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { api } from '../../services/api';

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'meeting' | 'deadline' | 'milestone' | 'personal'>('meeting');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.getCalendarEvents();
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !startTime || !endTime) return;
    try {
      const res = await api.createCalendarEvent({
        title: eventTitle,
        event_type: eventType,
        start_time: startTime,
        end_time: endTime,
        location,
      });
      setEvents([...events, res.event]);
      setShowAddModal(false);
      setEventTitle('');
      setStartTime('');
      setEndTime('');
      setLocation('');
    } catch (err: any) {
      alert(err.message || 'Error creating event');
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-page-title text-text-main font-semibold">
            {monthNames[month]} {year}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="btn-outlined btn-sm p-1.5"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="btn-outlined btn-sm p-1.5"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-accent">
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="ui-card p-0 overflow-hidden">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 bg-page border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-[12px] font-semibold text-text-muted uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days matrix */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Empty pre-month padding days */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border-r border-b border-border bg-[#FAFAFB] min-h-[110px]"
            />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = events.filter((e) => e.start_time && e.start_time.startsWith(dateStr));
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === dayNum;

            return (
              <div
                key={dayNum}
                className={`border-r border-b border-border p-2.5 min-h-[110px] flex flex-col justify-start transition-colors ${
                  isToday ? 'bg-accent-subtle/30' : 'bg-surface hover:bg-page/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-6 h-6 flex items-center justify-center text-[12px] rounded-full font-medium ${
                      isToday
                        ? 'bg-accent text-white font-semibold'
                        : 'text-text-muted'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[85px]">
                  {dayEvents.map((ev, idx) => {
                    let badgeClass = 'bg-accent-subtle text-accent';
                    if (ev.event_type === 'deadline') badgeClass = 'bg-[#FEE4E2] text-danger';
                    if (ev.event_type === 'milestone') badgeClass = 'bg-[#ECFDF3] text-[#027A48]';

                    return (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded-[6px] text-[11px] font-medium truncate ${badgeClass}`}
                        title={`${ev.title} (${ev.start_time})`}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="text-card-title text-text-main font-semibold">Create Calendar Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-text-muted hover:text-text-main rounded"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  className="ui-input w-full"
                  placeholder="e.g. Sprint Demo or Architecture Review"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Type
                </label>
                <select
                  className="ui-input w-full"
                  value={eventType}
                  onChange={(e: any) => setEventType(e.target.value)}
                >
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Task Deadline</option>
                  <option value="milestone">Milestone</option>
                  <option value="personal">Personal Focus</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-secondary font-medium text-text-main mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="ui-input w-full"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-secondary font-medium text-text-main mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="ui-input w-full"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-secondary font-medium text-text-main mb-1.5">
                  Location or Virtual Link
                </label>
                <input
                  type="text"
                  className="ui-input w-full"
                  placeholder="e.g. Virtual Room #room-mesh or Main Boardroom"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outlined"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
