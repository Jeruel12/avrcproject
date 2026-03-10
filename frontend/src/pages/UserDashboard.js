import React, { useState, useEffect } from 'react';
import '../styles/UserDashboard.css';

function UserDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('User');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAccountSuccess, setShowAccountSuccess] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationData, setReservationData] = useState({
    dateNeeded: '',
    timeNeeded: '',
    purpose: ''
  });
  const [selectedEquipmentsList, setSelectedEquipmentsList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showRoomReservationForm, setShowRoomReservationForm] = useState(false);
  const [roomReservationData, setRoomReservationData] = useState({
    dateNeeded: '',
    timeFrom: '',
    timeTo: '',
    purpose: ''
  });
  const [selectedRoomsList, setSelectedRoomsList] = useState([]);
  const [showRoomReservationSuccess, setShowRoomReservationSuccess] = useState(false);
  const [showReservationSuccess, setShowReservationSuccess] = useState(false);
  const [equipmentReservations, setEquipmentReservations] = useState([]);
  const [roomReservations, setRoomReservations] = useState([]);
  const [reservationFilterTab, setReservationFilterTab] = useState('equipment');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteNotifConfirm, setShowDeleteNotifConfirm] = useState(false);
  const [showDeleteAllNotifConfirm, setShowDeleteAllNotifConfirm] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState(null);
  const [activeReservation, setActiveReservation] = useState(null);
  const [equipmentReservationError, setEquipmentReservationError] = useState('');
  const [roomReservationError, setRoomReservationError] = useState('');
  const [reservedSlots, setReservedSlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedRoomView, setSelectedRoomView] = useState(101);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Hi! I\'m your AVRC Assistant. I can help you reserve equipment or rooms. What would you like to do?', sender: 'bot', timestamp: new Date(), suggestions: ['Reserve Equipment', 'Reserve Room', 'View Reservations'] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatContext, setChatContext] = useState({
    lastReserved: null,
    preferredEquipment: null,
    preferredRoom: null,
    searchedItem: null
  });
  const [editReservationData, setEditReservationData] = useState({
    dateNeeded: '',
    timeNeeded: '',
    timeFrom: '',
    timeTo: '',
    purpose: ''
  });
  const [accountInfo, setAccountInfo] = useState({
    fullname: '',
    email: '',
    id_number: '',
    department: '',
    sub: ''
  });
  const [editedInfo, setEditedInfo] = useState({
    fullname: '',
    email: '',
    id_number: '',
    department: '',
    sub: ''
  });
  const [notifications, setNotifications] = useState([]);

  // Helper functions for equipment status
  const getEquipmentStatusLabel = (equipment) => {
    if (equipment && equipment.status) return equipment.status;
    return equipment && equipment.available ? 'Available' : 'Not Available';
  };

  const getEquipmentStatusClass = (label) => {
    const key = label.toLowerCase().replace(/ /g, '-');
    return key; // returns: 'available', 'not-available', 'under-maintenance', 'for-repair'
  };

  const isEquipmentAvailable = (equipment) => {
    const label = getEquipmentStatusLabel(equipment);
    return label.toLowerCase() === 'available';
  };

  useEffect(() => {
    const storedName = localStorage.getItem('user_fullname') || 'User';
    setUserName(storedName);
    
    // Fetch user account information from backend
    const userId = localStorage.getItem('user_id');
    if (userId) {
      fetch(`http://localhost:8000/auth/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setAccountInfo({
            fullname: data.fullname,
            email: data.email,
            id_number: data.id_number,
            department: data.department || '',
            sub: data.sub || ''
          });
          setEditedInfo({
            fullname: data.fullname,
            email: data.email,
            id_number: data.id_number,
            department: data.department || '',
            sub: data.sub || ''
          });
        }
      })
      .catch(err => console.error('Failed to fetch user info:', err));
    }
  }, []);

  // Update editedInfo when accountInfo changes
  useEffect(() => {
    setEditedInfo(accountInfo);
  }, [accountInfo]);

  // Fetch equipment from backend
  // helper to load reservations and mark equipment availability
  const refreshReservations = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`http://localhost:8000/reservations/?user_id=${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // normalize to camelCase and compute itemName
        const normalize = (r) => {
          const out = {
            ...r,
            itemType: r.item_type,
            item_id: r.item_id,
            dateNeeded: r.date_needed,
            timeFrom: r.time_from,
            timeTo: r.time_to,
            timeNeeded: r.time_from || r.time_to || r.time_needed
          };
          if (r.item_type === 'equipment') {
            const eq = equipmentList.find(e => e.id === r.item_id);
            out.itemName = eq ? `${eq.name} (#${eq.item_number})` : '';
            out.equipmentId = r.item_id;
          } else if (r.item_type === 'room') {
            const rm = roomList.find(rm => rm.id === r.item_id);
            out.itemName = rm ? rm.name : '';
            out.equipmentId = r.item_id;
          }
          return out;
        };
        const eq = data.filter(r => r.item_type === 'equipment').map(normalize);
        const rm = data.filter(r => r.item_type === 'room').map(normalize);
        setEquipmentReservations(eq);
        setRoomReservations(rm);
      }
      
      // Also refresh equipment list from backend to get real availability status
      const equipRes = await fetch('http://localhost:8000/equipment/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (equipRes.ok) {
        const equipData = await equipRes.json();
        setEquipmentList(equipData);
      }
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:8000/notifications/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await fetch('http://localhost:8000/equipment/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEquipmentList(data);
        }
      } catch (err) {
        console.error('Failed to fetch equipment:', err);
      }
    };
    const fetchRooms = async () => {
      try {
        const res = await fetch('http://localhost:8000/rooms/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRoomList(data);
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };

    // perform all loads sequentially to ensure reservations can use latest lists
    (async () => {
      await fetchEquipment();
      await fetchRooms();
      await refreshReservations();
      await fetchNotifications();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure we auto-select the first room when the room list changes
  useEffect(() => {
    if (!roomList || roomList.length === 0) return;
    const exists = roomList.some(r => r.id === selectedRoomView);
    if (!exists) {
      setSelectedRoomView(roomList[0].id);
    }
  }, [roomList, selectedRoomView]);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        if (showChatbot) {
          setShowChatbot(false);
        }
      }
    };

    const handleClickOutside = (e) => {
      const profileMenu = document.querySelector('.userdash-profile-menu');
      if (profileMenu && !profileMenu.contains(e.target)) {
        setShowProfileMenu(false);
      }
      
      const chatbotWindow = document.querySelector('.chatbot-window');
      const chatbotButton = document.querySelector('.chatbot-toggle-btn');
      if (chatbotWindow && !chatbotWindow.contains(e.target) && !chatbotButton.contains(e.target)) {
        setShowChatbot(false);
      }
    };

    if (showProfileMenu || showChatbot) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu, showChatbot]);

  // Smooth scroll to top when switching tabs (without jerky movement)
  useEffect(() => {
    // Use smooth scrolling for gradual transition
    const scrollToTop = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 0) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };
    
    scrollToTop();
  }, [activeTab]);

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper function to format date as "Month DD, YYYY"
  const formatDateWithMonthName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper function to check if reservation is within office hours
  const isWithinOfficeHours = (dateString, timeString, allowEndInclusive = false) => {
    // Accept date strings in ISO (`yyyy-mm-dd`) or `dd/mm/yyyy` formats.
    let date;
    if (!dateString) return false;
    if (dateString.includes('/')) {
      // assume dd/mm/yyyy
      const parts = dateString.split('/').map(p => parseInt(p, 10));
      if (parts.length === 3) {
        const [d, m, y] = parts;
        date = new Date(y, (m || 1) - 1, d || 1);
      } else {
        date = new Date(dateString);
      }
    } else {
      // try Date constructor (handles yyyy-mm-dd and ISO)
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return false;
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Office is closed on Sunday
    if (dayOfWeek === 0) {
      return false;
    }

    // Parse the time
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Monday to Friday: 7:30 AM to 5:00 PM
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const openTime = 7 * 60 + 30; // 7:30 AM
      const closeTime = 17 * 60; // 5:00 PM
      return allowEndInclusive ? (totalMinutes >= openTime && totalMinutes <= closeTime) : (totalMinutes >= openTime && totalMinutes < closeTime);
    }

    // Saturday: 8:00 AM to 12:00 PM
    if (dayOfWeek === 6) {
      const openTime = 8 * 60; // 8:00 AM
      const closeTime = 12 * 60; // 12:00 PM
      return allowEndInclusive ? (totalMinutes >= openTime && totalMinutes <= closeTime) : (totalMinutes >= openTime && totalMinutes < closeTime);
    }

    return false;
  };

  const formatReservationTime = (reservation) => {
    if (!reservation) return '';
    // For equipment reservations show a single time (timeNeeded/timeFrom/timeTo)
    if (reservation.itemType === 'equipment' || reservation.itemType === 'Equipment') {
      const t = reservation.timeNeeded || reservation.timeFrom || reservation.timeTo || reservation.time_needed || reservation.time_from || reservation.time_to;
      return t ? formatTimeWithAMPM(t) : '';
    }

    // For rooms show a range when both are present, otherwise fallback to a single time
    if (reservation.timeFrom && reservation.timeTo) {
      return `${formatTimeWithAMPM(reservation.timeFrom)} to ${formatTimeWithAMPM(reservation.timeTo)}`;
    }
    if (reservation.timeNeeded) return formatTimeWithAMPM(reservation.timeNeeded);
    return '';
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
    setShowProfileMenu(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    setShowLogoutModal(false);
    if (onLogout) onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const deleteNotification = async (notifId) => {
    try {
      await fetch(`http://localhost:8000/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setShowDeleteNotifConfirm(false);
      setNotifToDelete(null);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      for (const notif of notifications) {
        await fetch(`http://localhost:8000/notifications/${notif.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
      }
      setNotifications([]);
      setShowDeleteAllNotifConfirm(false);
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
      alert('Failed to delete all notifications');
    }
  };

  const handleViewAccount = () => {
    setShowAccountModal(true);
    setShowProfileMenu(false);
  };

  const handleAccountChange = (field, value) => {
    setEditedInfo({
      ...editedInfo,
      [field]: value
    });
  };

  const handleSaveAccount = () => {
    const userId = localStorage.getItem('user_id');
    fetch(`http://localhost:8000/auth/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(editedInfo)
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        setAccountInfo(editedInfo);
        setUserName(editedInfo.fullname);
        localStorage.setItem('user_fullname', editedInfo.fullname);
        setShowAccountSuccess(true);
        setTimeout(() => {
          setShowAccountSuccess(false);
          setShowAccountModal(false);
        }, 2000);
      }
    })
    .catch(err => {
      alert('Failed to save account information');
    });
  };

  const handleCancelAccount = () => {
    setEditedInfo(accountInfo);
    setShowAccountModal(false);
  };

  const handleProceedToReservation = () => {
    setEquipmentReservationError('');
    setSelectedEquipmentsList(selectedEquipments);
    setShowReservationForm(true);
  };

  const handleProceedToRoomReservation = () => {
    setRoomReservationError('');
    setSelectedRoomsList(selectedRooms);
    setShowRoomReservationForm(true);
  };

  const handleReservationChange = (field, value) => {
    setReservationData({
      ...reservationData,
      [field]: value
    });
  };

  const handleSubmitReservation = async () => {
    setEquipmentReservationError('');
    
    if (!reservationData.dateNeeded || !reservationData.timeNeeded || !reservationData.purpose) {
      setEquipmentReservationError('Please fill in all fields');
      return;
    }

    // Check if reservation is within office hours
    if (!isWithinOfficeHours(reservationData.dateNeeded, reservationData.timeNeeded)) {
      const date = new Date(reservationData.dateNeeded);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0) {
        setEquipmentReservationError('Sorry, we are closed on Sundays. Please choose a different date.');
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        setEquipmentReservationError('Equipment reservation must be between 7:30 AM and 5:00 PM on weekdays (Monday-Friday).');
      } else if (dayOfWeek === 6) {
        setEquipmentReservationError('Equipment reservation must be between 8:00 AM and 12:00 PM on Saturdays.');
      }
      return;
    }

    // Persist each equipment reservation to backend
    const payloads = selectedEquipmentsList.map(equipmentId => {
      return {
        item_type: 'equipment',
        item_id: equipmentId,
        date_needed: reservationData.dateNeeded,
        time_from: reservationData.timeNeeded,
        time_to: reservationData.timeNeeded,
        purpose: reservationData.purpose
      };
    });

    try {
      const created = [];
      for (let p of payloads) {
        const res = await fetch('http://localhost:8000/reservations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(p)
        });
        if (res.ok) {
          const data = await res.json();
          created.push(data);
        } else {
          const err = await res.json().catch(() => ({}));
          console.error('Failed to create reservation', err);
        }
      }
      if (created.length > 0) {
        setEquipmentReservations([...equipmentReservations, ...created]);
        await refreshReservations();
      }
    } catch (err) {
      console.error('Error creating equipment reservations:', err);
    }
    
    console.log('Reservation submitted:', {
      equipments: selectedEquipmentsList,
      ...reservationData
    });
    
    setShowReservationSuccess(true);
    setTimeout(() => {
      setShowReservationSuccess(false);
      setShowReservationForm(false);
      setReservationData({ dateNeeded: '', timeNeeded: '', purpose: '' });
      setSelectedEquipments([]);
      setActiveTab('my-reservation');
      setReservationFilterTab('equipment');
    }, 2500);
  };

  const handleCancelReservation = () => {
    setShowReservationForm(false);
    setReservationData({ dateNeeded: '', timeNeeded: '', purpose: '' });
    setEquipmentReservationError('');
  };

  const isSunday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDay() === 0; // Sunday = 0
  };

  const handleRoomReservationChange = (field, value) => {
    setRoomReservationData({
      ...roomReservationData,
      [field]: value
    });

    // Fetch reserved slots when room or date changes
    if (field === 'dateNeeded' || field === 'dateNeeded') {
      if (selectedRoomsList.length > 0 && value) {
        // Don't fetch if it's Sunday - office is closed
        if (!isSunday(value)) {
          fetchRoomAvailability(selectedRoomsList[0], value);
        } else {
          setReservedSlots([]);
        }
      }
    }
  };

  const fetchRoomAvailability = async (roomId, dateNeeded) => {
    if (!roomId || !dateNeeded) return;
    
    setLoadingAvailability(true);
    try {
      const res = await fetch(
        `http://localhost:8000/reservations/availability/${roomId}/${dateNeeded}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setReservedSlots(data.reserved_slots || []);
      }
    } catch (err) {
      console.error('Error fetching room availability:', err);
    }
    setLoadingAvailability(false);
  };

  const handleSubmitRoomReservation = async () => {
    setRoomReservationError('');

    const { dateNeeded, timeFrom, timeTo, purpose } = roomReservationData;
    if (!dateNeeded || !timeFrom || !timeTo || !purpose) {
      setRoomReservationError('Please fill in all fields');
      return;
    }

    // Ensure start < end
    if (timeFrom >= timeTo) {
      setRoomReservationError('End time must be after start time');
      return;
    }

    // Check both times are within office hours (end time may be equal to closing time)
    if (!isWithinOfficeHours(dateNeeded, timeFrom, false) || !isWithinOfficeHours(dateNeeded, timeTo, true)) {
      const date = new Date(dateNeeded);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0) {
        setRoomReservationError('Sorry, we are closed on Sundays. Please choose a different date.');
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        setRoomReservationError('Room reservation must be between 7:30 AM and 5:00 PM on weekdays (Monday-Friday).');
      } else if (dayOfWeek === 6) {
        setRoomReservationError('Room reservation must be between 8:00 AM and 12:00 PM on Saturdays.');
      }
      return;
    }

    // Do not change room availability on reservation — multiple users can reserve the same room

    // Overlap detection helper
    const toMinutes = (t) => {
      if (!t) return null;
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };

    const overlaps = (s1, e1, s2, e2) => {
      return s1 < e2 && s2 < e1;
    };

    // Block lunch time (12:00 PM - 1:00 PM)
    const reqStart = toMinutes(timeFrom);
    const reqEnd = toMinutes(timeTo);
    const LUNCH_START = 12 * 60; // 12:00 PM
    const LUNCH_END = 13 * 60; // 1:00 PM
    if (reqStart == null || reqEnd == null) {
      setRoomReservationError('Invalid time format.');
      return;
    }
    if (reqStart < LUNCH_END && LUNCH_START < reqEnd) {
      setRoomReservationError('Selected time overlaps lunch break (12:00 PM - 1:00 PM). Please choose another time.');
      return;
    }

    // Validate for each selected room whether the requested time overlaps existing room reservations
    for (let roomId of selectedRoomsList) {
      const existing = roomReservations.filter(r => r.equipmentId === roomId && r.dateNeeded === dateNeeded);
      if (existing.length === 0) continue;

      const reqStart = toMinutes(timeFrom);
      const reqEnd = toMinutes(timeTo);
      const duration = reqEnd - reqStart;

      // find any overlap
      const conflicting = existing.filter(r => {
        const exStart = toMinutes(r.timeFrom || r.timeNeeded);
        const exEnd = toMinutes(r.timeTo || r.timeNeeded);
        if (exStart == null || exEnd == null) return false;
        return overlaps(reqStart, reqEnd, exStart, exEnd);
      });

      if (conflicting.length > 0) {
        // compute suggestion: next available start after the latest end among existing reservations
        const latestEnd = Math.max(...existing.map(r => toMinutes(r.timeTo || r.timeNeeded)));
        const suggestedStart = latestEnd;
        const suggestedEnd = suggestedStart + duration;
        const fmt = (m) => {
          const hh = Math.floor(m / 60).toString().padStart(2, '0');
          const mm = (m % 60).toString().padStart(2, '0');
          return formatTimeWithAMPM(`${hh}:${mm}`);
        };
        const room = roomList.find(r => r.id === roomId);
        const suggestionMsg = `Selected time overlaps with existing reservation for ${room ? room.name : 'this room'}. Suggested available: ${fmt(suggestedStart)} to ${fmt(suggestedEnd)}.`;
        setRoomReservationError(suggestionMsg);
        return;
      }
    }

    // Persist to backend
    try {
      const created = [];
      let hasError = false;
      for (let roomId of selectedRoomsList) {
        const payload = {
          item_type: 'room',
          item_id: roomId,
          date_needed: dateNeeded,
          time_from: timeFrom,
          time_to: timeTo,
          purpose: purpose
        };
        const res = await fetch('http://localhost:8000/reservations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          created.push(data);
        } else {
          hasError = true;
          const err = await res.json().catch(() => ({}));
          const errorMsg = err.detail || 'Failed to create room reservation. Please try again.';
          setRoomReservationError(errorMsg);
          console.error('Failed to create room reservation', err);
          break; // Stop on first error
        }
      }
      if (hasError) {
        return; // Don't proceed if there's an error
      }
      if (created.length > 0) {
        setRoomReservations([...roomReservations, ...created]);
        await refreshReservations();
      }
    } catch (err) {
      setRoomReservationError('Error creating room reservations: ' + (err.message || 'Unknown error'));
      console.error('Error creating room reservations:', err);
    }

    console.log('Room reservation submitted:', {
      rooms: selectedRoomsList,
      ...roomReservationData
    });
    
    setShowRoomReservationSuccess(true);
    setTimeout(() => {
      setShowRoomReservationSuccess(false);
      setShowRoomReservationForm(false);
      setRoomReservationData({ dateNeeded: '', timeFrom: '', timeTo: '', purpose: '' });
      setSelectedRooms([]);
      setActiveTab('my-reservation');
      setReservationFilterTab('room');
    }, 2500);
  };

  const handleCancelRoomReservation = () => {
    setShowRoomReservationForm(false);
    setRoomReservationData({ dateNeeded: '', timeFrom: '', timeTo: '', purpose: '' });
    setRoomReservationError('');
  };

  const handleViewReservation = (reservation) => {
    // compute itemName if missing
    const res = { ...reservation };
    if (!res.itemName) {
      if (res.item_type === 'equipment') {
        const eq = equipmentList.find(e => e.id === res.item_id);
        res.itemName = eq ? `${eq.name} (#${eq.item_number})` : '';
        res.equipmentId = res.item_id;
      } else if (res.item_type === 'room') {
        const rm = roomList.find(r => r.id === res.item_id);
        res.itemName = rm ? rm.name : '';
        res.equipmentId = res.item_id;
      }
    }
    setActiveReservation(res);
    setShowViewModal(true);
  };

  const handleEditReservation = (reservation) => {
    // Check if reservation is already approved - prevent editing
    const status = (reservation.status || 'pending').toString().toLowerCase();
    if (status === 'approved' || status === 'confirmed') {
      alert('Approved reservations cannot be edited. Please contact admin to delete and create a new reservation if needed.');
      return;
    }
    
    // compute itemName if missing
    const res = { ...reservation };
    if (!res.itemName) {
      if (res.item_type === 'equipment') {
        const eq = equipmentList.find(e => e.id === res.item_id);
        res.itemName = eq ? `${eq.name} (#${eq.item_number})` : '';
        res.equipmentId = res.item_id;
      } else if (res.item_type === 'room') {
        const rm = roomList.find(r => r.id === res.item_id);
        res.itemName = rm ? rm.name : '';
        res.equipmentId = res.item_id;
      }
    }
    setActiveReservation(res);
    const normalizeDateForInput = (d) => {
      if (!d) return '';
      // if format is dd/mm/yyyy convert to yyyy-mm-dd
      if (d.includes('/')) {
        const parts = d.split('/').map(p => p.padStart(2, '0'));
        if (parts.length === 3) {
          const [dd, mm, yyyy] = parts;
          return `${yyyy}-${mm}-${dd}`;
        }
      }
      // if already yyyy-mm-dd or ISO, try to extract yyyy-mm-dd
      try {
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      } catch (e) {}
      return d;
    };

    setEditReservationData({
      dateNeeded: normalizeDateForInput(res.date_needed || res.dateNeeded),
      timeNeeded: res.time_needed || res.timeNeeded || '',
      timeFrom: res.time_from || res.timeFrom || '',
      // clear timeTo for equipment reservations (no end time)
      timeTo: res.item_type === 'equipment' ? '' : (res.time_to || res.timeTo || ''),
      purpose: res.purpose
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    // Validate for equipment (timeNeeded) or room (timeFrom/timeTo)
    if (!editReservationData.dateNeeded || !editReservationData.purpose) {
      alert('Please fill in all fields');
      return;
    }
    // Determine room-edit based on the actual reservation item type (more reliable)
    const isRoomEdit = activeReservation && activeReservation.item_type === 'room';
    if (isRoomEdit) {
      // ensure times are within office hours (allow end time to equal close)
      if (!isWithinOfficeHours(editReservationData.dateNeeded, editReservationData.timeFrom, false) || !isWithinOfficeHours(editReservationData.dateNeeded, editReservationData.timeTo, true)) {
        alert('Room reservation must be between 7:30 AM and 5:00 PM on weekdays (Monday-Friday).');
        return;
      }
      if (!editReservationData.timeFrom || !editReservationData.timeTo) {
        alert('Please provide both start and end times');
        return;
      }
      if (editReservationData.timeFrom >= editReservationData.timeTo) {
        alert('End time must be after start time');
        return;
      }
    } else {
      if (!editReservationData.timeNeeded) {
        alert('Please provide a time');
        return;
      }
    }
    
    // Determine if this is an equipment or room reservation
    const isEquipmentReservation = equipmentReservations.some(r => r.id === activeReservation.id);
    
    if (isEquipmentReservation) {
      // prepare snake_case payload expected by backend
      const payload = {
        item_type: 'equipment',
        date_needed: editReservationData.dateNeeded,
        time_from: editReservationData.timeNeeded,
        time_to: editReservationData.timeNeeded,
        purpose: editReservationData.purpose
      };

      // persist edit to backend
      fetch(`http://localhost:8000/reservations/${activeReservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (res.ok) return res.json();
          return res.json().then(data => Promise.reject(data));
        })
        .then(updated => {
          // refresh reservations from server to ensure UI matches DB
          refreshReservations();
        })
        .catch(err => {
          console.error('Failed to update equipment reservation', err);
          const errorMsg = err.detail || 'Unable to update reservation.';
          alert(errorMsg);
        });
    } else {
      // Check overlap with other room reservations for same room/date
      const toMinutes = (t) => {
        if (!t) return null;
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + mm;
      };
      const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

      const editedStart = toMinutes(editReservationData.timeFrom);
      const editedEnd = toMinutes(editReservationData.timeTo);

      // Block lunch time (12:00 PM - 1:00 PM) for edited reservations
      const LUNCH_START = 12 * 60;
      const LUNCH_END = 13 * 60;
      if (editedStart == null || editedEnd == null) {
        alert('Invalid time format.');
        return;
      }
      if (editedStart < LUNCH_END && LUNCH_START < editedEnd) {
        alert('Edited time overlaps lunch break (12:00 PM - 1:00 PM). Please choose another time.');
        return;
      }

      // find the room id for this reservation
      const roomId = activeReservation.equipmentId;
      const others = roomReservations.filter(r => r.equipmentId === roomId && r.id !== activeReservation.id && r.dateNeeded === editReservationData.dateNeeded);
      const conflict = others.some(r => {
        const exStart = toMinutes(r.timeFrom || r.timeNeeded);
        const exEnd = toMinutes(r.timeTo || r.timeNeeded);
        if (exStart == null || exEnd == null) return false;
        return overlaps(editedStart, editedEnd, exStart, exEnd);
      });

      if (conflict) {
        alert('Edited time overlaps an existing reservation for this room. Please choose another time.');
        return;
      }

      // prepare snake_case payload for room update
      const payload = {
        date_needed: editReservationData.dateNeeded,
        time_from: editReservationData.timeFrom,
        time_to: editReservationData.timeTo,
        purpose: editReservationData.purpose
      };

      // persist edit
      fetch(`http://localhost:8000/reservations/${activeReservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(updated => {
          // refresh reservations from server to ensure UI matches DB
          refreshReservations();
        })
        .catch(err => {
          console.error('Failed to update room reservation', err);
          alert('Unable to update reservation.');
        });
    }
    
    setShowEditModal(false);
    setActiveReservation(null);
  };

  const handleDeleteClick = (reservation) => {
    setActiveReservation(reservation);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    // Determine if this is an equipment or room reservation based on which array contains it
    const isEquipmentReservation = equipmentReservations.some(r => r.id === activeReservation.id);
    
    const performDelete = async () => {
      try {
        const res = await fetch(`http://localhost:8000/reservations/${activeReservation.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (!res.ok) {
          console.error('failed to delete reservation on server');
        }
      } catch (err) {
        console.error('error deleting reservation', err);
      }
    };

    // optimistically update UI
    if (isEquipmentReservation) {
      // Mark equipment as available again
      if (activeReservation.equipmentId) {
        const updatedEquipmentList = equipmentList.map(eq => 
          eq.id === activeReservation.equipmentId 
            ? { ...eq, available: true } 
            : eq
        );
        setEquipmentList(updatedEquipmentList);
      }
      setEquipmentReservations(equipmentReservations.filter(r => r.id !== activeReservation.id));
    } else {
      setRoomReservations(roomReservations.filter(r => r.id !== activeReservation.id));
    }

    performDelete().then(() => refreshReservations());
    
    setShowDeleteConfirm(false);
    setActiveReservation(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setActiveReservation(null);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    
    // Enhanced NLP with context awareness and item detection
    let botResponse = '';
    let suggestions = [];
    const input = chatInput.toLowerCase();
    
    // Detect equipment items mentioned
    const equipmentItems = ['speaker', 'microphone', 'mic', 'hdmi', 'cable', 'extension', 'flag', 'tv'];
    let detectedItem = null;
    for (let item of equipmentItems) {
      if (input.includes(item)) {
        detectedItem = item;
        break;
      }
    }
    
    if (input.includes('available') || input.includes('may available')) {
      if (detectedItem) {
        botResponse = `Let me show you the available ${detectedItem}s. I'll take you to see all options.`;
        suggestions = ['Check Availability', 'Reserve Now', 'Back'];
        setChatContext({ ...chatContext, searchedItem: detectedItem, lastReserved: 'equipment' });
      } else if (input.includes('room') || input.includes('213') || input.includes('214') || input.includes('215')) {
        botResponse = `I'll show you the available rooms. Which one interests you?`;
        suggestions = ['Room 213', 'Room 214', 'Room 215', 'View All'];
      } else {
        botResponse = 'What would you like to check availability for? Equipment or rooms?';
        suggestions = ['Equipment', 'Rooms'];
      }
    } else if (input.includes('reserve') || input.includes('book')) {
      if (input.includes('equipment') || input.includes('speaker') || input.includes('microphone') || input.includes('cable') || input.includes('flag') || input.includes('tv')) {
        botResponse = `I'd be happy to help you reserve equipment. Based on your request, here are some good options. Which one interests you?`;
        suggestions = ['New Reservation', 'View My Reservations', 'Cancel'];
        setChatContext({ ...chatContext, lastReserved: 'equipment', searchedItem: detectedItem });
      } else if (input.includes('room') || input.includes('213') || input.includes('214') || input.includes('215')) {
        botResponse = `Great! I can help you book a room. Which room would you prefer: Room 213, 214, or 215?`;
        suggestions = ['Room 213', 'Room 214', 'Room 215', 'Back'];
        setChatContext({ ...chatContext, lastReserved: 'room', preferredRoom: null });
      } else {
        botResponse = 'Would you like to reserve equipment or a room? I can help with either!';
        suggestions = ['Equipment', 'Rooms', 'View All'];
      }
    } else if (input.includes('view') || input.includes('my') || input.includes('reservation')) {
      botResponse = 'You can view all your reservations in the "MY RESERVATION" tab. Would you like me to show you something specific?';
      suggestions = ['Equipment Reservations', 'Room Reservations', 'Calendar View'];
    } else if (input.includes('thanks') || input.includes('thank') || input.includes('ok')) {
      botResponse = 'You\'re welcome! Feel free to ask me anything else. 😊';
      suggestions = ['Create New Reservation', 'Check Availability', 'Help'];
    } else if (input.includes('help') || input.includes('how')) {
      botResponse = 'I can help you with:\n• Check available equipment or rooms\n• Reserve equipment or rooms\n• View your reservations\n• Get information about our services\n\nWhat would you like?';
      suggestions = ['Check Availability', 'Make Reservation', 'My Reservations'];
    } else {
      botResponse = chatContext.lastReserved ? 
        `I can help with that! Since you were interested in ${chatContext.lastReserved === 'equipment' ? 'equipment' : 'rooms'}, would you like to continue with that?` :
        'I can help you check availa­bility or make reservations for equipment or rooms. What would you like to do?';
      suggestions = ['Continue Previous', 'New Reservation', 'Help'];
    }

    const botMessage = {
      id: updatedMessages.length + 1,
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
      suggestions: suggestions
    };
    
    setChatMessages([...updatedMessages, botMessage]);
    setChatInput('');
  };

  const handleQuickAction = (action) => {
    setChatInput(action);
    
    // Simulate sending the quick action
    const userMessage = {
      id: chatMessages.length + 1,
      text: action,
      sender: 'user',
      timestamp: new Date()
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    
    // Generate response based on quick action
    let botResponse = '';
    let suggestions = [];
    
    if (action === 'Check Availability') {
      if (chatContext.searchedItem) {
        // Check if there are available items of this type
        const itemsOfType = equipmentList.filter(eq => 
          eq.name.toLowerCase() === chatContext.searchedItem.toLowerCase()
        );
        const availableItems = itemsOfType.filter(eq => isEquipmentAvailable(eq));
        
        if (availableItems.length > 0) {
          botResponse = `Perfect! I'm showing you all available ${chatContext.searchedItem}s. You can reserve any of them right away!`;
        } else if (itemsOfType.length > 0) {
          botResponse = `Sorry, there are no available ${chatContext.searchedItem}s at the moment. All items are currently reserved or unavailable.`;
        } else {
          botResponse = `I couldn't find any ${chatContext.searchedItem}s in our inventory.`;
        }
        // Navigate to equipments tab and filter by searched item
        setActiveTab('equipments');
        setSelectedCategory(chatContext.searchedItem.toUpperCase());
        suggestions = [];
      } else {
        botResponse = 'Let me take you to see all available equipment and rooms!';
        setActiveTab('equipments');
        suggestions = [];
      }
    } else if (action === 'Reserve Equipment') {
      botResponse = 'Perfect! Let me take you to the equipment reservation page. Click "Reserve Equipment" button above to get started.';
      setActiveTab('equipments');
      suggestions = [];
    } else if (action === 'Reserve Now') {
      botResponse = 'Great! I\'ll take you to complete the reservation now.';
      setActiveTab('equipments');
      suggestions = [];
    } else if (action === 'Reserve Room') {
      botResponse = 'Great! I\'ll help you reserve a room. Click "Reserve Room" button above to begin.';
      setActiveTab('rooms');
      suggestions = [];
    } else if (action === 'View Reservations') {
      botResponse = 'Click the "MY RESERVATION" tab to see all your upcoming reservations!';
      suggestions = [];
    } else if (action === 'Equipment Reservations' || action === 'Room Reservations' || action === 'Calendar View') {
      botResponse = `Showing you ${action}! Check the "MY RESERVATION" tab.`;
      setActiveTab('my-reservation');
      suggestions = [];
    } else if (action === 'Room 213' || action === 'Room 214' || action === 'Room 215') {
      botResponse = `${action} is a great choice! Let me take you to complete the reservation.`;
      setActiveTab('rooms');
      setSelectedRoomView(parseInt(action.replace('Room ', '')) === 213 ? 101 : parseInt(action.replace('Room ', '')) === 214 ? 102 : 103);
      suggestions = [];
      setChatContext({ ...chatContext, preferredRoom: action });
    } else {
      botResponse = 'Got it! Let me help you with that.';
      suggestions = [];
    }
    
    const botMessage = {
      id: updatedMessages.length + 1,
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
      suggestions: suggestions
    };
    
    setChatMessages([...updatedMessages, botMessage]);
    setChatInput('');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        const allUpcomingReservations = [...equipmentReservations, ...roomReservations].sort((a, b) => {
          return new Date(a.dateNeeded) - new Date(b.dateNeeded);
        }).slice(0, 4);

        return (
          <div className="dashboard-content" key={activeTab}>
            <div className="dashboard-header">
              <h1>Welcome, {userName}</h1>
              <p>Manage your reservations, view available equipment, and track your requests easily.</p>
            </div>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Equipment Reservation</h3>
                <button className="dashboard-btn" onClick={() => setActiveTab('equipments')}>Reserve Equipment</button>
              </div>
              <div className="dashboard-card">
                <h3>Room Reservation</h3>
                <button className="dashboard-btn" onClick={() => setActiveTab('rooms')}>Reserve Room</button>
              </div>
            </div>

            {allUpcomingReservations.length > 0 && (
              <div className="upcoming-reservations-section">
                <h2 className="upcoming-title">Upcoming Reservations</h2>
                <div className="upcoming-reservations-list">
                  {allUpcomingReservations.map(reservation => {
                    let displayName = reservation.itemName || reservation.roomName || '';
                    
                    // For equipment, append item number
                    if (reservation.item_type === 'equipment' || !reservation.item_type) {
                      const equipId = reservation.equipmentId || reservation.item_id || reservation.itemId;
                      if (equipId && equipmentList && equipmentList.length > 0) {
                        const found = equipmentList.find(e => String(e.id) === String(equipId));
                        if (found) {
                          displayName = `${found.name} #${found.item_number}`;
                        }
                      }
                    } else if (reservation.item_type === 'room') {
                      // For rooms, use the room name
                      const roomId = reservation.equipmentId || reservation.item_id || reservation.itemId;
                      if (roomId && roomList && roomList.length > 0) {
                        const foundRoom = roomList.find(r => String(r.id) === String(roomId));
                        if (foundRoom) {
                          // Ensure format is "Room XXX"
                          const roomName = foundRoom.name;
                          displayName = roomName.includes('Room') ? roomName : `Room ${roomName}`;
                        }
                      }
                    }
                    
                    return (
                      <div key={reservation.id} className="upcoming-item">
                        <div className="upcoming-item-name">
                          {displayName}
                        </div>
                        <div className="upcoming-item-date">
                          {formatDateWithMonthName(reservation.dateNeeded)} {formatReservationTime(reservation) ? `- ${formatReservationTime(reservation)}` : ''}
                        </div>
                        <div className="upcoming-item-purpose">
                          Purpose: {reservation.purpose}
                        </div>
                        <div className={`upcoming-status ${reservation.status?.toLowerCase() || 'pending'}`}>
                          {reservation.status || 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      case 'my-reservation':
        const displayedReservations = reservationFilterTab === 'equipment' ? equipmentReservations : reservationFilterTab === 'room' ? roomReservations : [];
        
        return (
          <div className="dashboard-content" key={activeTab}>
            <h2 className="reservations-title">My Reservations</h2>
            
            <div className="reservation-tabs">
              <button 
                className={`reservation-tab-btn ${reservationFilterTab === 'equipment' ? 'active' : ''}`}
                onClick={() => setReservationFilterTab('equipment')}
              >
                Equipment Reservation
              </button>
              <button 
                className={`reservation-tab-btn ${reservationFilterTab === 'room' ? 'active' : ''}`}
                onClick={() => setReservationFilterTab('room')}
              >
                Room Reservation
              </button>
              <button 
                className={`reservation-tab-btn ${reservationFilterTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setReservationFilterTab('calendar')}
              >
                Calendar
              </button>
            </div>

            {reservationFilterTab === 'calendar' ? (
              <div className="calendar-view">
                <div className="calendar-header">
                  <button onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear(calendarYear - 1);
                    } else {
                      setCalendarMonth(calendarMonth - 1);
                    }
                  }}>← Previous</button>
                  <h3 className="calendar-month-year">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear(calendarYear + 1);
                    } else {
                      setCalendarMonth(calendarMonth + 1);
                    }
                  }}>Next →</button>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  padding: '16px 0',
                  marginBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#fbbf24',
                      borderRadius: '3px'
                    }}></div>
                    <span style={{fontSize: '14px', color: '#666', fontWeight: '500'}}>Pending</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#10b981',
                      borderRadius: '3px'
                    }}></div>
                    <span style={{fontSize: '14px', color: '#666', fontWeight: '500'}}>Approved</span>
                  </div>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-day-header">Sunday</div>
                  <div className="calendar-day-header">Monday</div>
                  <div className="calendar-day-header">Tuesday</div>
                  <div className="calendar-day-header">Wednesday</div>
                  <div className="calendar-day-header">Thursday</div>
                  <div className="calendar-day-header">Friday</div>
                  <div className="calendar-day-header">Saturday</div>

                  {(() => {
                    const firstDay = new Date(calendarYear, calendarMonth, 1);
                    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startingDayOfWeek = firstDay.getDay();
                    const days = [];

                    // Add empty cells for days before the month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="calendar-day empty-day"></div>
                      );
                    }

                    // Add days of the month
                    const allReservations = [...equipmentReservations, ...roomReservations];
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayReservations = allReservations.filter(r => r.dateNeeded === dateString);

                      // mark today
                      const today = new Date();
                      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      const isToday = dateString === todayString;

                      days.push(
                        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                          <div className="calendar-day-number">{day}</div>
                          <div className="calendar-day-events">
                            {dayReservations.map((res, idx) => {
                              const statusClass = res.status ? res.status.toLowerCase() : 'pending';
                              return (
                                <div key={idx} className={`calendar-event ${statusClass}`} onClick={() => handleViewReservation(res)}>
                                  <div className="event-title">{res.itemName}</div>
                                  <div className="event-time">{formatReservationTime(res)}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>
            ) : displayedReservations.length === 0 ? (
              <div className="empty-state">
                <p>You haven't made any {reservationFilterTab === 'equipment' ? 'equipment' : 'room'} reservations yet.</p>
                <button className="dashboard-btn" onClick={() => setActiveTab(reservationFilterTab === 'equipment' ? 'equipments' : 'rooms')}>Make a Reservation</button>
              </div>
            ) : (
              <div className="reservations-table-container">
                <table className="reservations-table">
                    <thead>
                    <tr>
                    <th>{reservationFilterTab === 'room' ? 'Room Number' : 'Item Name'}</th>
                    {reservationFilterTab === 'equipment' && <th>Item Number</th>}
                    <th>Date Needed</th>
                    <th>Time Needed</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedReservations.map(reservation => {
                      // Render room names when viewing room reservations, otherwise derive equipment name/number
                      let itemNameOnly = '';
                      let itemNumber = '-';

                      if (reservationFilterTab === 'room') {
                        const roomId = reservation.equipmentId || reservation.item_id || reservation.itemId || reservation.itemId;
                        if (roomId && roomList && roomList.length > 0) {
                          const foundRoom = roomList.find(r => String(r.id) === String(roomId) || String(r.id) === String(Number(roomId)));
                          if (foundRoom) {
                            itemNameOnly = foundRoom.name || '';
                          }
                        }

                        // Fallbacks
                        if (!itemNameOnly) {
                          if (reservation.itemName) itemNameOnly = reservation.itemName;
                          else if (reservation.name) itemNameOnly = reservation.name;
                          else if (reservation.item_name) itemNameOnly = reservation.item_name;
                        }
                      } else {
                        // equipment
                        const equipId = reservation.equipmentId || reservation.item_id || reservation.itemId || reservation.itemId;
                        if (equipId && equipmentList && equipmentList.length > 0) {
                          const found = equipmentList.find(e => String(e.id) === String(equipId) || String(e.id) === String(Number(equipId)));
                          if (found) {
                            itemNameOnly = found.name || '';
                            itemNumber = found.item_number != null ? String(found.item_number) : '-';
                          }
                        }

                        // Fallbacks if not found above
                        if (!itemNameOnly) {
                          if (reservation.itemName) {
                            // strip trailing " (#123)" if present
                            itemNameOnly = reservation.itemName.replace(/ \(#\d+\)/, '');
                            const match = reservation.itemName.match(/#(\d+)/);
                            if (match) itemNumber = match[1];
                          } else if (reservation.name) {
                            itemNameOnly = reservation.name;
                          } else if (reservation.item_name) {
                            itemNameOnly = reservation.item_name;
                          }
                        }

                        if (itemNumber === '-' && (reservation.item_number || reservation.itemNumber)) {
                          itemNumber = reservation.item_number || reservation.itemNumber;
                        }
                      }

                      return (
                      <tr key={reservation.id}>
                        <td className="item-name">{itemNameOnly}</td>
                        {reservationFilterTab === 'equipment' && <td className="item-number-cell">#{itemNumber}</td>}
                        <td>{reservation.dateNeeded}</td>
                        <td>{formatReservationTime(reservation)}</td>
                        <td className="purpose-cell">{reservation.purpose}</td>
                        <td>
                          <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                            {reservation.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn view-btn" title="View" onClick={() => handleViewReservation(reservation)}>
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                              <path fill="currentColor" d="M12 5c-7 0-11 6-11 7s4 7 11 7 11-6 11-7-4-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                            </svg>
                          </button>
                          {(() => {
                            const status = (reservation.status || 'pending').toString().toLowerCase();
                            const isApproved = status === 'approved' || status === 'confirmed';
                            if (!isApproved) {
                              return (
                                <button className="action-btn edit-btn" title="Edit" onClick={() => handleEditReservation(reservation)}>
                                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                                  </svg>
                                </button>
                              );
                            }
                            return null;
                          })()}
                          <button className="action-btn delete-btn" title="Delete" onClick={() => handleDeleteClick(reservation)}>
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                              <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'equipments':
        const categories = ['ALL', 'SPEAKER', 'MICROPHONE', 'EXTENSION', 'TV', 'FLAG', 'HDMI', 'PROJECTOR'];

        const filteredEquipments = selectedCategory === 'ALL'
          ? equipmentList
          : equipmentList.filter(eq => {
              const cat = eq && eq.category ? String(eq.category).toUpperCase() : '';
              const name = eq && eq.name ? String(eq.name).toUpperCase() : '';
              return cat === selectedCategory || name === selectedCategory;
            });

        const toggleEquipment = (equipmentId) => {
          if (selectedEquipments.includes(equipmentId)) {
            setSelectedEquipments(selectedEquipments.filter(id => id !== equipmentId));
          } else {
            setSelectedEquipments([...selectedEquipments, equipmentId]);
          }
        };

        return (
          <div className="dashboard-content" key={activeTab}>
            <h2 className="equipment-title">AVRC Equipments</h2>
            
            <div className="equipment-filter-container">
              <div className="equipment-filters">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`equipment-filter-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className={`equipment-actions ${selectedEquipments.length === 0 ? 'hidden' : ''}`}>
                <button 
                  className="equipment-unselect-btn"
                  onClick={() => setSelectedEquipments([])}
                >
                  Unselect All
                </button>
                <button className="dashboard-btn" onClick={handleProceedToReservation}>Proceed to Reservation</button>
              </div>
            </div>

            <div className="equipment-grid-new">
              {filteredEquipments.map(equipment => (
                <div key={equipment.id} className="equipment-card-new">
                  <input
                    type="checkbox"
                    id={`equipment-${equipment.id}`}
                    checked={selectedEquipments.includes(equipment.id)}
                    onChange={() => toggleEquipment(equipment.id)}
                    className="equipment-checkbox-new"
                    disabled={!isEquipmentAvailable(equipment)}
                  />
                  <div className="equipment-image-placeholder">
                    {equipment.image ? (
                      <img 
                        src={equipment.image} 
                        alt={equipment.name}
                        style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}}
                      />
                    ) : (
                      <div style={{fontSize: '0.8rem', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="equipment-item-name">{equipment.name}</h3>
                  <div className={`equipment-status ${getEquipmentStatusClass(getEquipmentStatusLabel(equipment))}`}>
                    {getEquipmentStatusLabel(equipment)}
                  </div>
                  <div className="equipment-item-number">Item #{equipment.item_number}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'rooms':
        const toggleRoom = (roomId) => {
          if (selectedRooms.includes(roomId)) {
            setSelectedRooms(selectedRooms.filter(id => id !== roomId));
          } else {
            setSelectedRooms([...selectedRooms, roomId]);
          }
        };

        const viewedRoom = roomList.find(room => room.id === selectedRoomView);

        return (
          <div className="dashboard-content" key={activeTab}>
            <h2 className="equipment-title">AVRC Rooms</h2>

            <div className="rooms-selection-container">
              <div className="rooms-selection-pills">
                {roomList.map(room => (
                  <button
                    key={room.id}
                    className={`room-pill ${selectedRoomView === room.id ? 'active' : ''} ${!room.available ? 'disabled' : ''}`}
                    onClick={() => setSelectedRoomView(room.id)}
                    disabled={!room.available}
                  >
                    {room.name}
                  </button>
                ))}
              </div>

              <div className={`equipment-actions ${selectedRooms.length === 0 ? 'hidden' : ''}`}>
                <button 
                  className="equipment-unselect-btn"
                  onClick={() => setSelectedRooms([])}
                >
                  Unselect All
                </button>
                <button className="dashboard-btn" onClick={handleProceedToRoomReservation}>Proceed to Reservation</button>
              </div>
            </div>

            <div className="equipment-grid-new">
              {viewedRoom && (
                <div key={viewedRoom.id} className="room-card-new">
                  <input
                    type="checkbox"
                    id={`room-${viewedRoom.id}`}
                    checked={selectedRooms.includes(viewedRoom.id)}
                    onChange={() => toggleRoom(viewedRoom.id)}
                    className="room-checkbox-new"
                    disabled={!viewedRoom.available}
                  />
                  <h3 className="room-name">{viewedRoom.name}</h3>
                  <div className="room-image-placeholder" style={{
                    width: '100%',
                    height: '300px',
                    background: '#eee',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {viewedRoom.image ? (
                      <img
                        src={viewedRoom.image}
                        alt={viewedRoom.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '20px'
                        }}
                      />
                    ) : (
                      <span style={{color: '#999', fontSize: '0.9rem'}}>No image</span>
                    )}
                  </div>
                  <div className={`equipment-status ${viewedRoom.available ? 'available' : 'not-available'}`}>
                    {viewedRoom.available ? 'Available' : 'Not Available'}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'notifications':
        const markAsRead = async (notifId) => {
          try {
            await fetch(`http://localhost:8000/notifications/${notifId}/read`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            setNotifications(prev => prev.map(n => n.id === notifId ? {...n, read: true} : n));
          } catch (err) {
            console.error('Failed to mark notification as read:', err);
          }
        };

        const markAllAsRead = async () => {
          try {
            const unreadNotifications = notifications.filter(n => !n.read);
            for (const notif of unreadNotifications) {
              await fetch(`http://localhost:8000/notifications/${notif.id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
              });
            }
            setNotifications(prev => prev.map(n => ({...n, read: true})));
          } catch (err) {
            console.error('Failed to mark all as read:', err);
            alert('Failed to mark all notifications as read');
          }
        };

        return (
          <div className="dashboard-content" key={activeTab}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingRight: '20px'}}>
              <h2 className="equipment-title" style={{margin: 0}}>Notifications</h2>
              {notifications.length > 0 && (
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#218838'}
                      onMouseOut={(e) => e.target.style.background = '#28a745'}
                    >
                      <span></span> Mark All Read
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteAllNotifConfirm(true)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c82333'}
                    onMouseOut={(e) => e.target.style.background = '#dc3545'}
                  >
                    <span></span> Delete All
                  </button>
                </div>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                <p style={{fontSize: '1.1rem', marginBottom: '12px'}}>No notifications yet</p>
                <p style={{fontSize: '0.9rem'}}>You'll be notified about reservation updates and announcements here.</p>
              </div>
            ) : (
              <div style={{maxWidth: '900px', margin: '0 auto', padding: '20px'}}>
                {notifications.map(notif => {
                  const isApproval = notif.type === 'approval';
                  const isRejection = notif.type === 'rejection';
                  const date = new Date(notif.created_at);
                  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  
                  return (
                    <div 
                      key={notif.id} 
                      style={{
                        background: notif.read ? '#f9f9f9' : '#fff',
                        border: `2px solid ${isApproval ? '#28a745' : isRejection ? '#dc3545' : '#007bff'}`,
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '16px',
                        boxShadow: notif.read ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                        opacity: notif.read ? 0.7 : 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                            <span style={{
                              fontSize: '24px',
                              lineHeight: 1
                            }}>
                              {isApproval ? '✅' : isRejection ? '❌' : 'ℹ️'}
                            </span>
                            <h3 style={{
                              margin: 0,
                              fontSize: '1.1rem',
                              color: isApproval ? '#28a745' : isRejection ? '#dc3545' : '#007bff'
                            }}>
                              {notif.title}
                            </h3>
                          </div>
                          <p style={{
                            margin: '8px 0',
                            color: '#333',
                            fontSize: '0.95rem',
                            lineHeight: 1.5
                          }}>
                            {notif.message}
                          </p>
                          <p style={{
                            margin: '8px 0 0 0',
                            color: '#999',
                            fontSize: '0.85rem'
                          }}>
                            {dateStr} at {timeStr}
                          </p>
                        </div>
                        <div style={{display: 'flex', gap: '8px', marginLeft: '12px'}}>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#0056b3'}
                              onMouseOut={(e) => e.target.style.background = '#007bff'}
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setNotifToDelete(notif);
                              setShowDeleteNotifConfirm(true);
                            }}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#c82333'}
                            onMouseOut={(e) => e.target.style.background = '#dc3545'}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="userdash-container">
      {/* Navbar */}
      <nav className="userdash-navbar">
        <div className="userdash-nav-content">
          <div className="userdash-nav-tabs">
            <button 
              className={`userdash-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              DASHBOARD
            </button>
            <button 
              className={`userdash-nav-tab ${activeTab === 'my-reservation' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-reservation')}
            >
              MY RESERVATION
            </button>
            <button 
              className={`userdash-nav-tab ${activeTab === 'equipments' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipments')}
            >
              EQUIPMENTS
            </button>
            <button 
              className={`userdash-nav-tab ${activeTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              ROOMS
            </button>
            <button 
              className={`userdash-nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
              style={{position: 'relative', paddingRight: '28px'}}
            >
              NOTIFICATIONS
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  right: '4px',
                  transform: 'translateY(-50%)',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
          <div className="userdash-nav-right">
            <div className="userdash-profile-menu">
              <button 
                className="btn btn-light userdash-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="13" stroke="#333" strokeWidth="1.8" fill="none"/>
                  <circle cx="14" cy="9.5" r="4" fill="#333"/>
                  <path d="M 6 19.5 Q 6 15.5 14 15.5 Q 22 15.5 22 19.5 Q 22 23 14 23 Q 6 23 6 19.5" fill="#333"/>
                </svg>
              </button>
              {showProfileMenu && (
                <div className="userdash-profile-dropdown">
                  <button className="userdash-dropdown-item" onClick={handleViewAccount} style={{cursor: 'pointer', fontWeight: 500}}>{userName}</button>
                  <hr style={{margin: '8px 0'}} />
                  <button className="userdash-dropdown-item logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="userdash-main">
        {renderContent()}
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal-bg">
          <div className="logout-modal">
            <h2 className="logout-modal-title">Confirm Logout</h2>
            <p className="logout-modal-text">Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button className="logout-modal-btn cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="logout-modal-btn confirm-btn" onClick={confirmLogout}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Info Modal */}
      {showAccountModal && (
        <div className="account-modal-bg">
          <div className="account-modal">
            <h2 className="account-modal-title">Account Information</h2>
            {showAccountSuccess && (
              <div className="account-success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#10b981"/>
                </svg>
                <span>Account information updated successfully!</span>
              </div>
            )}
            <div className="account-form">
              <div className="account-form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editedInfo.fullname}
                  onChange={(e) => handleAccountChange('fullname', e.target.value)}
                  className="account-input"
                />
              </div>
              <div className="account-form-group">
                <label>Email</label>
                <input 
                  type="email"
                  value={editedInfo.email}
                  onChange={(e) => handleAccountChange('email', e.target.value)}
                  className="account-input"
                />
              </div>
              <div className="account-form-group">
                <label>ID Number</label>
                <input 
                  type="text"
                  value={editedInfo.id_number}
                  onChange={(e) => handleAccountChange('id_number', e.target.value)}
                  className="account-input"
                />
              </div>
              <div className="account-form-group">
                <label>Department</label>
                <input 
                  type="text"
                  value={editedInfo.department}
                  onChange={(e) => handleAccountChange('department', e.target.value)}
                  className="account-input"
                />
              </div>
              <div className="account-form-group">
                <label>Sub/Grade</label>
                <input 
                  type="text"
                  value={editedInfo.sub}
                  onChange={(e) => handleAccountChange('sub', e.target.value)}
                  className="account-input"
                />
              </div>
            </div>
            <div className="account-modal-buttons">
              <button className="account-modal-btn cancel-btn" onClick={handleCancelAccount}>
                Cancel
              </button>
              <button className="account-modal-btn save-btn" onClick={handleSaveAccount}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <div className="reservation-modal-bg">
          <div className="reservation-modal">
            <h2 className="reservation-modal-title">Equipment Reservation Form</h2>
            {equipmentReservationError && (
              <div className="reservation-error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
                  <path d="M12 7v5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="17" r="1" fill="#dc2626"/>
                </svg>
                <span>{equipmentReservationError}</span>
              </div>
            )}
            <div className="reservation-form">
              <div className="reservation-form-group">
                <label>Date Needed</label>
                <input 
                  type="date" 
                  value={reservationData.dateNeeded}
                  onChange={(e) => handleReservationChange('dateNeeded', e.target.value)}
                  className="reservation-input"
                />
              </div>
              <div className="reservation-form-group">
                <label>Time Needed</label>
                <input 
                  type="time"
                  value={reservationData.timeNeeded}
                  onChange={(e) => handleReservationChange('timeNeeded', e.target.value)}
                  className="reservation-input"
                />
              </div>
              <div className="reservation-form-group">
                <label>Purpose</label>
                <textarea
                  value={reservationData.purpose}
                  onChange={(e) => handleReservationChange('purpose', e.target.value)}
                  className="reservation-textarea"
                  placeholder="Enter the purpose of reservation"
                  rows="4"
                />
              </div>
            </div>
            <div className="reservation-modal-buttons">
              <button className="reservation-modal-btn cancel-btn" onClick={handleCancelReservation}>
                Cancel
              </button>
              <button className="reservation-modal-btn submit-btn" onClick={handleSubmitReservation}>
                Submit Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Success Modal */}
      {showReservationSuccess && (
        <div className="reservation-success-bg">
          <div className="reservation-success-modal">
            <div className="reservation-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
              </svg>
            </div>
            <h3 className="reservation-success-title">Reservation Submitted!</h3>
            <p className="reservation-success-text">Your equipment reservation has been successfully submitted.</p>
          </div>
        </div>
      )}

      {/* View Reservation Modal */}
      {showViewModal && activeReservation && (
        (() => {
          // determine whether this reservation is for equipment or room by looking up lists
          const res = activeReservation;
          const eqId = res.equipmentId || res.item_id || res.itemId;
          const foundEquip = equipmentList && equipmentList.length ? equipmentList.find(e => String(e.id) === String(eqId)) : null;
          const foundRoom = roomList && roomList.length ? roomList.find(r => String(r.id) === String(eqId)) : null;
          const isEquipment = !!foundEquip;
          const title = isEquipment ? (foundEquip.name || res.itemName || `Equipment #${foundEquip?.item_number || ''}`) : (foundRoom ? (foundRoom.name || res.itemName) : (res.itemName || 'Reservation'));
          const imageSrc = isEquipment ? (foundEquip.image || null) : (foundRoom ? (foundRoom.image || null) : null);
          const itemNumber = isEquipment ? (foundEquip.item_number != null ? String(foundEquip.item_number) : (res.item_number || res.itemNumber || '-')) : null;

          return (
            <div className="view-modal-bg">
              <div className="view-modal">
                <h2 className="view-modal-title">{title}</h2>
                <div className="view-modal-image-container">
                  <div className="view-modal-image-placeholder">
                    {imageSrc ? (
                      <img src={imageSrc} alt={title} />
                    ) : (
                      <div style={{color: '#999'}}>No image available</div>
                    )}
                  </div>
                </div>
                <div className="view-modal-details">
                  {isEquipment && <p><strong>Item Number:</strong> #{itemNumber}</p>}
                  <p><strong>Date Needed:</strong> {res.dateNeeded}</p>
                  <p><strong>Time Needed:</strong> {formatReservationTime(res)}</p>
                  <p><strong>Purpose:</strong> {res.purpose}</p>
                  <p><strong>Status:</strong> <span className={`status-badge status-${res.status.toLowerCase()}`}>{res.status}</span></p>
                </div>
                <div className="view-modal-button">
                  <button className="view-modal-close-btn" onClick={() => setShowViewModal(false)}>Close</button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Edit Reservation Modal */}
      {showEditModal && activeReservation && (
        <div className="edit-modal-bg">
          <div className="edit-modal">
            <h2 className="edit-modal-title">Edit Reservation - {activeReservation.itemName}</h2>
            <div className="edit-modal-form">
              <div className="edit-form-group">
                <label>Date Needed</label>
                <input 
                  type="date" 
                  value={editReservationData.dateNeeded}
                  onChange={(e) => setEditReservationData({...editReservationData, dateNeeded: e.target.value})}
                  className="edit-form-input"
                />
              </div>
              <div className="edit-form-group">
                <label>Time Needed</label>
                { (activeReservation && activeReservation.item_type === 'room') ? (
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input
                      type="time"
                      value={editReservationData.timeFrom}
                      onChange={(e) => setEditReservationData({...editReservationData, timeFrom: e.target.value})}
                      className="edit-form-input"
                    />
                    <span style={{color: '#666', padding: '0 6px'}}>to</span>
                    <input
                      type="time"
                      value={editReservationData.timeTo}
                      onChange={(e) => setEditReservationData({...editReservationData, timeTo: e.target.value})}
                      className="edit-form-input"
                    />
                  </div>
                ) : (
                  <input 
                    type="time"
                    value={editReservationData.timeNeeded}
                    onChange={(e) => setEditReservationData({...editReservationData, timeNeeded: e.target.value})}
                    className="edit-form-input"
                  />
                )}
              </div>
              <div className="edit-form-group">
                <label>Purpose</label>
                <textarea
                  value={editReservationData.purpose}
                  onChange={(e) => setEditReservationData({...editReservationData, purpose: e.target.value})}
                  className="edit-form-textarea"
                  rows="4"
                />
              </div>
            </div>
            <div className="edit-modal-buttons">
              <button className="edit-modal-btn cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="edit-modal-btn save-btn" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && activeReservation && (
        <div className="delete-confirm-bg">
          <div className="delete-confirm-modal">
            <h2 className="delete-confirm-title">Delete Reservation</h2>
            <p className="delete-confirm-text">Are you sure you want to delete your reservation for <strong>{activeReservation.itemName}</strong>?</p>
            <div className="delete-confirm-buttons">
              <button className="delete-confirm-btn cancel-btn" onClick={handleCancelDelete}>Cancel</button>
              <button className="delete-confirm-btn delete-btn" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Notification Confirmation Modal */}
      {showDeleteNotifConfirm && notifToDelete && (
        <div className="delete-confirm-bg">
          <div className="delete-confirm-modal">
            <h2 className="delete-confirm-title">Delete Notification</h2>
            <p className="delete-confirm-text">Are you sure you want to delete this notification?</p>
            <div className="delete-confirm-buttons">
              <button className="delete-confirm-btn cancel-btn" onClick={() => {
                setShowDeleteNotifConfirm(false);
                setNotifToDelete(null);
              }}>Cancel</button>
              <button className="delete-confirm-btn delete-btn" onClick={() => deleteNotification(notifToDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Notifications Confirmation Modal */}
      {showDeleteAllNotifConfirm && (
        <div className="delete-confirm-bg">
          <div className="delete-confirm-modal">
            <h2 className="delete-confirm-title">Delete All Notifications</h2>
            <p className="delete-confirm-text">Are you sure you want to delete all notifications? This cannot be undone.</p>
            <div className="delete-confirm-buttons">
              <button className="delete-confirm-btn cancel-btn" onClick={() => setShowDeleteAllNotifConfirm(false)}>Cancel</button>
              <button className="delete-confirm-btn delete-btn" onClick={() => deleteAllNotifications()}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Reservation Form Modal */}
      {showRoomReservationForm && (
        <div className="reservation-modal-bg">
          <div className="reservation-modal">
            <h2 className="reservation-modal-title">Room Reservation Form</h2>
            {roomReservationError && (
              <div className="reservation-error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
                  <path d="M12 7v5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="17" r="1" fill="#dc2626"/>
                </svg>
                <span>{roomReservationError}</span>
              </div>
            )}
            <div className="reservation-form">
              <div className="reservation-form-group">
                <label>Date Needed</label>
                <input 
                  type="date" 
                  value={roomReservationData.dateNeeded}
                  onChange={(e) => handleRoomReservationChange('dateNeeded', e.target.value)}
                  className="reservation-input"
                />
              </div>
              <div className="reservation-form-group">
                <label>Time Needed</label>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input
                    type="time"
                    value={roomReservationData.timeFrom}
                    onChange={(e) => handleRoomReservationChange('timeFrom', e.target.value)}
                    className="reservation-input"
                    aria-label="Start time"
                    disabled={roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded)}
                    style={{
                      opacity: roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded) ? 0.5 : 1,
                      cursor: roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded) ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <span style={{color: '#666', padding: '0 6px'}}>to</span>
                  <input
                    type="time"
                    value={roomReservationData.timeTo}
                    onChange={(e) => handleRoomReservationChange('timeTo', e.target.value)}
                    className="reservation-input"
                    aria-label="End time"
                    disabled={roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded)}
                    style={{
                      opacity: roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded) ? 0.5 : 1,
                      cursor: roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded) ? 'not-allowed' : 'pointer'
                    }}
                  />
                </div>
                {roomReservationData.timeFrom && roomReservationData.timeTo && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#1976d2',
                    fontWeight: '500'
                  }}>
                    Selected time: {formatTimeWithAMPM(roomReservationData.timeFrom)} to {formatTimeWithAMPM(roomReservationData.timeTo)}
                  </div>
                )}
              </div>

              {/* Show reserved slots or Sunday closed message */}
              {roomReservationData.dateNeeded && selectedRoomsList.length > 0 && (
                <div className="reservation-form-group">
                  <label>Availability on {new Date(roomReservationData.dateNeeded).toLocaleDateString()}</label>
                  {isSunday(roomReservationData.dateNeeded) ? (
                    <div style={{
                      backgroundColor: '#fee2e2',
                      border: '2px solid #dc2626',
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '14px',
                      color: '#991b1b',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{fontSize: '18px'}}>🔴</span>
                      <span>Office is CLOSED on Sundays. Please select a different date.</span>
                    </div>
                  ) : loadingAvailability ? (
                    <div style={{fontSize: '14px', color: '#666'}}>Loading availability...</div>
                  ) : reservedSlots.length > 0 ? (
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '14px'
                    }}>
                      <p style={{margin: '0 0 8px 0', fontWeight: '500', color: '#374151'}}>Already booked:</p>
                      {reservedSlots.map((slot, idx) => (
                        <div key={idx} style={{color: '#ef4444', marginBottom: '4px', paddingLeft: '8px'}}>
                          • {formatTimeWithAMPM(slot.start)} to {formatTimeWithAMPM(slot.end)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbefc2',
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '14px',
                      color: '#16a34a'
                    }}>
                      ✓ This room is available throughout the day
                    </div>
                  )}
                </div>
              )}
              <div className="reservation-form-group">
                <label>Purpose</label>
                <textarea
                  value={roomReservationData.purpose}
                  onChange={(e) => handleRoomReservationChange('purpose', e.target.value)}
                  className="reservation-textarea"
                  placeholder="Enter the purpose of reservation"
                  rows="4"
                />
              </div>
            </div>
            <div className="reservation-modal-buttons">
              <button className="reservation-modal-btn cancel-btn" onClick={handleCancelRoomReservation}>
                Cancel
              </button>
              <button 
                className="reservation-modal-btn submit-btn" 
                onClick={handleSubmitRoomReservation}
                disabled={roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded)}
                style={{
                  opacity: roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded) ? 0.5 : 1,
                  cursor: roomReservationData.dateNeeded && isSunday(roomReservationData.dateNeeded) ? 'not-allowed' : 'pointer'
                }}
              >
                Submit Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Reservation Success Modal */}
      {showRoomReservationSuccess && (
        <div className="reservation-success-bg">
          <div className="reservation-success-modal">
            <div className="reservation-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
              </svg>
            </div>
            <h3 className="reservation-success-title">Reservation Submitted!</h3>
            <p className="reservation-success-text">Your room reservation has been successfully submitted.</p>
          </div>
        </div>
      )}

      {/* Chatbot Backdrop Overlay */}
      {showChatbot && (
        <div className="chatbot-backdrop" onClick={() => setShowChatbot(false)}></div>
      )}

      {/* NLP Chatbot Widget */}
      <div className="chatbot-widget">
        <button 
          className="chatbot-toggle-btn"
          onClick={() => setShowChatbot(!showChatbot)}
          title="AVRC Assistant"
        >
          💬
        </button>
        
        {showChatbot && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <h3>AVRC Assistant</h3>
              <button 
                className="chatbot-close-btn"
                onClick={() => setShowChatbot(false)}
              >
                ×
              </button>
            </div>
            
            <div className="chatbot-messages">
              {chatMessages.map(msg => (
                <div key={msg.id}>
                  <div className={`chat-message ${msg.sender}`}>
                    <div className="chat-bubble">
                      {msg.text}
                    </div>
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="chat-suggestions">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(suggestion)}
                          className="suggestion-btn"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="chatbot-input-area">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Ask me anything..."
                className="chatbot-input"
              />
              <button 
                onClick={handleChatSend}
                className="chatbot-send-btn"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
