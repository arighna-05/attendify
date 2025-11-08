import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, BookOpen, Target } from 'lucide-react';
import { CollegeData, SubjectAttendance } from '../App';

interface RoutineBuilderProps {
  data: CollegeData;
  onDataChange: (data: CollegeData) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RoutineBuilder({ data, onDataChange }: RoutineBuilderProps) {
  const [subjectName, setSubjectName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState('');

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const addSubject = () => {
    if (subjectName && selectedDays.length > 0 && time) {
      const newSubject = {
        id: Date.now().toString(),
        name: subjectName,
        days: selectedDays,
        time,
      };

      // Create initial attendance record for this subject
      const newAttendance: SubjectAttendance = {
        subjectId: newSubject.id,
        weeklyRecords: {},
      };

      onDataChange({
        ...data,
        subjects: [...data.subjects, newSubject],
        subjectAttendance: [...data.subjectAttendance, newAttendance],
      });

      setSubjectName('');
      setSelectedDays([]);
      setTime('');
    }
  };

  const deleteSubject = (id: string) => {
    onDataChange({
      ...data,
      subjects: data.subjects.filter((s) => s.id !== id),
      subjectAttendance: data.subjectAttendance.filter((sa) => sa.subjectId !== id),
    });
  };

  const updateMinimumGoal = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onDataChange({ ...data, minimumGoal: numValue });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add Subject Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Subject
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              placeholder="e.g., Mathematics"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Days (Mon-Sat)</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={selectedDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <label
                    htmlFor={day}
                    className="text-gray-700 cursor-pointer"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            onClick={addSubject}
            disabled={!subjectName || selectedDays.length === 0 || !time}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </CardContent>
      </Card>

      {/* Minimum Goal Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Minimum Attendance Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="0"
              max="100"
              value={data.minimumGoal}
              onChange={(e) => updateMinimumGoal(e.target.value)}
              className="flex-1"
            />
            <span className="text-gray-600">%</span>
          </div>
          <p className="text-gray-600 mt-2">
            Set your target attendance percentage
          </p>
        </CardContent>
      </Card>

      {/* Current Subjects */}
      {data.subjects.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Your Subjects ({data.subjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-start justify-between p-4 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="text-gray-900">{subject.name}</div>
                  <p className="text-gray-600 mt-1">
                    {subject.days.join(', ')}
                  </p>
                  <p className="text-gray-500">{subject.time}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSubject(subject.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
