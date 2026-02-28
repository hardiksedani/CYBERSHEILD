import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Plus, ClipboardList, Trash2, Check, Lightbulb, Calendar, Target, Clock3 } from 'lucide-react';
import './ScheduledScansModal.css';

export default function ScheduledScansModal({ isOpen, onClose }) {
  const [schedules, setSchedules] = useState([
    { id: 1, target: 'example.com', frequency: 'Daily', time: '02:00', enabled: true },
    { id: 2, target: '10.0.0.1', frequency: 'Weekly', time: 'Sunday 03:00', enabled: true },
  ]);
  const [newSchedule, setNewSchedule] = useState({ target: '', frequency: 'Daily', time: '02:00' });

  const frequencyOptions = ['Daily', 'Weekly', 'Monthly'];

  const addSchedule = () => {
    if (newSchedule.target) {
      setSchedules([
        ...schedules,
        { id: Date.now(), ...newSchedule, enabled: true }
      ]);
      setNewSchedule({ target: '', frequency: 'Daily', time: '02:00' });
    }
  };

  const toggleSchedule = (id) => {
    setSchedules(schedules.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const deleteSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const getNextRun = (frequency, time) => {
    const now = new Date();
    const nextRun = new Date();
    const [hour, minute] = time.split(':');
    nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);

    if (nextRun < now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toLocaleDateString() + ' ' + nextRun.toLocaleTimeString().slice(0, 5);
  };

  return (
    <motion.div
      className={`schedule-modal-overlay ${isOpen ? 'open' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      onClick={onClose}
    >
      <motion.div
        className="schedule-modal"
        initial={{ scale: 0.8 }}
        animate={{ scale: isOpen ? 1 : 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}><X size={20} /></button>

        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={28} /> Scheduled Scans</h1>
        <p>Auto-run security scans on schedule</p>

        {/* Add New Schedule */}
        <div className="add-schedule-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Add Schedule</h3>
          <div className="schedule-form">
            <input
              type="text"
              placeholder="Target (IP/URL)"
              value={newSchedule.target}
              onChange={(e) => setNewSchedule({ ...newSchedule, target: e.target.value })}
            />
            <select
              value={newSchedule.frequency}
              onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
            >
              {frequencyOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input
              type="time"
              value={newSchedule.time}
              onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
            />
            <button className="btn-add" onClick={addSchedule} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Schedules List */}
        <div className="schedules-list-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={18} /> Active Schedules</h3>
          <div className="schedules-list">
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                className={`schedule-card ${schedule.enabled ? 'enabled' : 'disabled'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="schedule-toggle">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={() => toggleSchedule(schedule.id)}
                  />
                </div>
                <div className="schedule-info">
                  <div className="schedule-target" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> {schedule.target}</div>
                  <div className="schedule-frequency" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> {schedule.frequency} at {schedule.time}
                  </div>
                  <div className="schedule-next-run" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock3 size={12} /> Next run: {getNextRun(schedule.frequency, schedule.time)}
                  </div>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => deleteSchedule(schedule.id)}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="schedule-info-box">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={16} /> How It Works</h4>
          <ul style={{ paddingLeft: '24px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={12} color="#00ff88" /> Scans run automatically at scheduled times</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={12} color="#00ff88" /> Results saved to history automatically</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={12} color="#00ff88" /> Alerts sent if vulnerabilities found</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={12} color="#00ff88" /> Works even when app is minimized</li>
          </ul>
        </div>

        {/* Actions */}
        <button className="btn-done" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Check size={16} /> Done
        </button>
      </motion.div>
    </motion.div>
  );
}
