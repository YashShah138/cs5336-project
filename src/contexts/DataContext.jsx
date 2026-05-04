import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
  const [flights, setFlights] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [bags, setBags] = useState([]);
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [issues, setIssues] = useState([]);

  const refreshData = useCallback(async () => {
    try {
      const [f, p, b, s, m, i] = await Promise.all([
        api.get('/flights'),
        api.get('/passengers'),
        api.get('/bags'),
        api.get('/staff'),
        api.get('/messages'),
        api.get('/issues'),
      ]);
      setFlights(f);
      setPassengers(p);
      setBags(b);
      setStaff(s);
      setMessages(m);
      setIssues(i);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Flights
  const addFlight = useCallback(async (flightData) => {
    const newFlight = await api.post('/flights', flightData);
    setFlights(prev => [newFlight, ...prev]);
    return newFlight;
  }, []);

  const removeFlight = useCallback(async (id) => {
    await api.delete(`/flights/${id}`);
    setFlights(prev => prev.filter(f => f.id !== id));
    setPassengers(prev => prev.filter(p => p.flightId !== id));
    setBags(prev => prev.filter(b => b.flightId !== id));
  }, []);

  const updateFlightGate = useCallback(async (id, terminal, gate) => {
    const updated = await api.patch(`/flights/${id}/gate`, { terminal, gate });
    setFlights(prev => prev.map(f => f.id === id ? updated : f));
    return updated;
  }, []);

  const getFlightById = useCallback((id) => flights.find(f => f.id === id), [flights]);
  const getFlightsByAirline = useCallback((airlineCode) => flights.filter(f => f.airlineCode === airlineCode), [flights]);

  // Passengers
  const addPassenger = useCallback(async (passengerData) => {
    const newPassenger = await api.post('/passengers', passengerData);
    setPassengers(prev => [newPassenger, ...prev]);
    return newPassenger;
  }, []);

  const removePassenger = useCallback(async (id) => {
    await api.delete(`/passengers/${id}`);
    setPassengers(prev => prev.filter(p => p.id !== id));
    setBags(prev => prev.filter(b => b.passengerId !== id));
  }, []);

  const updatePassengerStatus = useCallback(async (id, status) => {
    const updated = await api.patch(`/passengers/${id}/status`, { status });
    setPassengers(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  }, []);

  const getPassengerById = useCallback((id) => passengers.find(p => p.id === id), [passengers]);
  const getPassengerByTicket = useCallback((ticketNumber) => passengers.find(p => p.ticketNumber === ticketNumber), [passengers]);
  const getPassengersByFlight = useCallback((flightId) => passengers.filter(p => p.flightId === flightId), [passengers]);

  // Bags
  const addBag = useCallback(async (bagData) => {
    const newBag = await api.post('/bags', bagData);
    setBags(prev => [newBag, ...prev]);
    return newBag;
  }, []);

  const updateBagLocation = useCallback(async (id, location, gateNumber, updatedBy) => {
    const updated = await api.patch(`/bags/${id}/location`, { location, gateNumber, updatedBy });
    setBags(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  }, []);

  const removeBag = useCallback(async (id) => {
    await api.delete(`/bags/${id}`);
    setBags(prev => prev.filter(b => b.id !== id));
  }, []);

  const getBagById = useCallback((bagId) => bags.find(b => b.bagId === bagId), [bags]);
  const getBagsByPassenger = useCallback((passengerId) => bags.filter(b => b.passengerId === passengerId), [bags]);
  const getBagsByFlight = useCallback((flightId) => bags.filter(b => b.flightId === flightId), [bags]);
  const getBagsByLocation = useCallback((location) => bags.filter(b => b.location === location), [bags]);

  // Staff
  const addStaff = useCallback(async (staffData) => {
    const result = await api.post('/staff', staffData);
    const { generatedCredentials, ...staffMember } = result;
    setStaff(prev => [staffMember, ...prev]);
    return { staff: staffMember, username: generatedCredentials.username, password: generatedCredentials.password };
  }, []);

  const removeStaff = useCallback(async (id) => {
    await api.delete(`/staff/${id}`);
    setStaff(prev => prev.filter(s => s.id !== id));
  }, []);

  const getStaffByType = useCallback((type) => staff.filter(s => s.staffType === type), [staff]);

  // Messages
  const addMessage = useCallback(async (messageData) => {
    const newMessage = await api.post('/messages', messageData);
    setMessages(prev => [newMessage, ...prev]);
    return newMessage;
  }, []);

  const getMessagesByBoard = useCallback((boardType) =>
    messages
      .filter(m => m.boardType === boardType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [messages]);

  // Issues
  const addIssue = useCallback(async (issueData) => {
    const newIssue = await api.post('/issues', issueData);
    setIssues(prev => [newIssue, ...prev]);
    return newIssue;
  }, []);

  return (
    <DataContext.Provider value={{
      flights, addFlight, removeFlight, updateFlightGate, getFlightById, getFlightsByAirline,
      passengers, addPassenger, removePassenger, updatePassengerStatus, getPassengerById, getPassengerByTicket, getPassengersByFlight,
      bags, addBag, removeBag, updateBagLocation, getBagById, getBagsByPassenger, getBagsByFlight, getBagsByLocation,
      staff, addStaff, removeStaff, getStaffByType,
      messages, addMessage, getMessagesByBoard,
      issues, addIssue,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
