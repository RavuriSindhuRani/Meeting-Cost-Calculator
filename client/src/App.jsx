import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

function App() {
  const [agenda, setAgenda] = useState('');
  const [people, setPeople] = useState([{ name: '', rate: '' }]);
  const [duration, setDuration] = useState(60);
  const [result, setResult] = useState(null);
  const [pastMeetings, setPastMeetings] = useState([]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const addPerson = () => {
    setPeople([...people, { name: '', rate: '' }]);
  };

  const removePerson = (index) => {
    setPeople(people.filter((_, i) => i!== index));
  };

  const updatePerson = (index, field, value) => {
    const newPeople = [...people];
    newPeople[index][field] = value;
    setPeople(newPeople);
  };

  const calculate = async () => {
    const validPeople = people.filter(p => p.name && p.rate);
    if (validPeople.length === 0 ||!duration) {
      alert('Add at least 1 person with rate and set duration');
      return;
    }

    try {
      const res = await axios.post(`${API}/meetings/calculate`, {
        people: validPeople.map(p => ({...p, rate: Number(p.rate) })),
        duration: Number(duration),
        agenda
      });
      setResult(res.data);
    } catch (err) {
      console.error(err.response?.data);
      alert('Calculate failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const saveMeeting = async () => {
    if (!result) {
      alert('Calculate cost first!');
      return;
    }
    try {
      await axios.post(`${API}/meetings`, {
        agenda,
        cost: result.total,
        duration: Number(duration),
        people_count: people.filter(p => p.name && p.rate).length
      });
      fetchMeetings();
      alert('Meeting saved!');
      setResult(null);
      setAgenda('');
      setPeople([{ name: '', rate: '' }]);
      setDuration(60);
    } catch (err) {
      console.error('Save error:', err.response?.data || err.message);
      alert('Error saving meeting');
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${API}/meetings`);
      setPastMeetings(res.data);
    } catch (err) {
      console.error('Failed to fetch meetings', err);
    }
  };

  const deleteMeeting = async (id) => {
    try {
      await axios.delete(`${API}/meetings/${id}`);
      fetchMeetings();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Meeting Cost Calculator</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Meeting Agenda</label>
          <input
            type="text"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="What is this meeting about?"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Attendees</label>
          {people.map((person, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={person.name}
                onChange={(e) => updatePerson(index, 'name', e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Hourly Rate"
                value={person.rate}
                onChange={(e) => updatePerson(index, 'rate', e.target.value)}
                className="w-32 p-2 border rounded"
              />
              {people.length > 1 && (
                <button
                  onClick={() => removePerson(index)}
                  className="bg-red-500 text-white px-3 rounded"
                >
                  X
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addPerson}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Add Person
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={calculate}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Calculate Cost
          </button>
          <button
            onClick={saveMeeting}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Save This Meeting
          </button>
        </div>

        {result && (
          <div className="mb-6 p-4 bg-green-50 rounded">
            <h2 className="font-bold">Total Cost: ${result.total}</h2>
            <p className="text-sm text-gray-600">Cost per minute: ${result.costPerMin}</p>
            <p className="text-sm text-gray-600">Duration: {result.duration} minutes</p>
            <div className={`mt-2 p-2 rounded text-sm ${
              result.recommendation.level === 'red'? 'bg-red-100' :
              result.recommendation.level === 'yellow'? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {result.recommendation.msg}
            </div>
            <div className="mt-2">
              {result.breakdown.map((p, i) => (
                <div key={i} className="text-sm">
                  {p.name}: ${p.rate}/hr × {result.duration}min = ${p.cost}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-2">Past Meetings</h2>
          {pastMeetings.length === 0? (
            <p className="text-gray-500">No meetings saved yet.</p>
          ) : (
            <div className="space-y-2">
              {pastMeetings.map((meeting) => (
                <div key={meeting._id} className="border p-3 rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{meeting.agenda || 'No agenda'}</div>
                    <div className="text-sm text-gray-600">
                      ${meeting.cost} • {meeting.duration}min • {meeting.people_count} people
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMeeting(meeting._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;