import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/meetingCost');

const meetingSchema = new mongoose.Schema({
  agenda: { type: String, default: '' },
  cost: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  people_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const Meeting = mongoose.model('Meeting', meetingSchema);

app.post('/api/meetings/calculate', (req, res) => {
  const { people, duration, agenda } = req.body;

  if (!people ||!duration || people.length === 0) {
    return res.status(400).json({ error: 'Missing people or duration' });
  }

  const breakdown = people.map(p => ({
    name: p.name,
    rate: Number(p.rate),
    cost: Number(((p.rate / 60) * duration).toFixed(2))
  }));

  const total = Number(breakdown.reduce((sum, p) => sum + p.cost, 0).toFixed(2));
  const costPerMin = Number((total / duration).toFixed(2));

  let recommendation = { level: 'green', msg: 'Good use of time!' };
  if (total > 500) recommendation = { level: 'red', msg: 'Expensive! Consider shorter meeting or fewer people.' };
  else if (total > 200) recommendation = { level: 'yellow', msg: 'Moderate cost. Make sure everyone needs to be here.' };

  res.json({ total, duration: Number(duration), breakdown, costPerMin, recommendation, agenda });
});

app.post('/api/meetings', async (req, res) => {
  try {
    const meeting = new Meeting(req.body);
    await meeting.save();
    res.status(201).json({ id: meeting._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ created_at: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});