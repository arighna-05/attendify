import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { TrendingUp, Plus, CheckCircle2, XCircle, BookOpen, Target, AlertTriangle } from 'lucide-react';
import { CollegeData, CollegeSubject } from '../App';

interface CollegeDashboardProps {
  data: CollegeData;
  onDataChange: (data: CollegeData) => void;
  ecaCount: number;
}

export function CollegeDashboard({ data, onDataChange, ecaCount }: CollegeDashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [inputTotalClasses, setInputTotalClasses] = useState('');
  const [inputAttendedClasses, setInputAttendedClasses] = useState('');

  const addSubject = () => {
    if (subjectName && inputTotalClasses && inputAttendedClasses) {
      const newSubject: CollegeSubject = {
        id: Date.now().toString(),
        name: subjectName,
        totalClasses: parseInt(inputTotalClasses),
        attendedClasses: parseInt(inputAttendedClasses),
      };

      onDataChange({
        ...data,
        subjects: [...data.subjects, newSubject],
      });

      // Reset form
      setSubjectName('');
      setInputTotalClasses('');
      setInputAttendedClasses('');
      setDialogOpen(false);
    }
  };

  const markPresent = (subjectId: string) => {
    const updatedSubjects = data.subjects.map((subject) => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          totalClasses: subject.totalClasses + 1,
          attendedClasses: subject.attendedClasses + 1,
        };
      }
      return subject;
    });
    onDataChange({ ...data, subjects: updatedSubjects });
  };

  const markAbsent = (subjectId: string) => {
    const updatedSubjects = data.subjects.map((subject) => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          totalClasses: subject.totalClasses + 1,
        };
      }
      return subject;
    });
    onDataChange({ ...data, subjects: updatedSubjects });
  };

  // Calculate overall stats
  const totalClasses = data.subjects.reduce((sum, subject) => sum + subject.totalClasses, 0);
  const attendedClasses = data.subjects.reduce((sum, subject) => sum + subject.attendedClasses, 0);
  const totalWithEca = totalClasses;
  const attendedWithEca = attendedClasses + ecaCount;
  const overallPercentage = totalClasses > 0 ? ((attendedWithEca / totalWithEca) * 100).toFixed(1) : '0.0';

  // Calculate classes to skip or attend
  const requiredClasses = Math.ceil((data.minimumGoal * totalClasses) / 100);
  const canSkip = Math.max(0, attendedWithEca - requiredClasses);
  const needToAttend = Math.max(0, requiredClasses - attendedWithEca);

  const updateMinimumGoal = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onDataChange({ ...data, minimumGoal: numValue });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Overall Summary Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Total Classes</span>
            <span>{attendedWithEca} / {totalWithEca}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Overall Percentage</span>
            <span>{overallPercentage}%</span>
          </div>
          <div className="pt-3 border-t border-white/20">
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, parseFloat(overallPercentage))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Goal Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Attendance Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="minimumGoal" className="whitespace-nowrap">
              Minimum Goal
            </Label>
            <Input
              id="minimumGoal"
              type="number"
              min="0"
              max="100"
              value={data.minimumGoal}
              onChange={(e) => updateMinimumGoal(e.target.value)}
              className="flex-1"
            />
            <span className="text-gray-600">%</span>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            parseFloat(overallPercentage) >= data.minimumGoal
              ? 'bg-green-50 border-green-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            {parseFloat(overallPercentage) >= data.minimumGoal ? (
              <div className="text-center">
                <p className="text-green-700 mb-1">🎉 Goal Achieved!</p>
                <p className="text-gray-700">
                  You can skip <span className="text-green-700">{canSkip} more classes</span>
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-amber-700 mb-1">Keep Going!</p>
                <p className="text-gray-700">
                  Attend <span className="text-amber-700">{needToAttend} more classes</span> to reach your goal
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subjects Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Subjects
          </h3>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>
                  Enter the subject details to start tracking attendance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
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
                  <Label htmlFor="totalClasses">Total Classes</Label>
                  <Input
                    id="totalClasses"
                    type="number"
                    min="0"
                    placeholder="e.g., 20"
                    value={inputTotalClasses}
                    onChange={(e) => setInputTotalClasses(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendedClasses">Attended Classes</Label>
                  <Input
                    id="attendedClasses"
                    type="number"
                    min="0"
                    placeholder="e.g., 15"
                    value={inputAttendedClasses}
                    onChange={(e) => setInputAttendedClasses(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={addSubject}
                  disabled={!subjectName || !inputTotalClasses || !inputAttendedClasses}
                >
                  Add Subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subject Cards */}
        {data.subjects.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">No subjects added yet</p>
              <p className="text-gray-500">Click "Add Subject" to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.subjects.map((subject) => {
              const percentage = subject.totalClasses > 0 
                ? ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(1) 
                : '0.0';

              return (
                <Card key={subject.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Subject Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-gray-900">{subject.name}</h4>
                          <p className="text-gray-600 mt-1">
                            {subject.attendedClasses} / {subject.totalClasses} classes
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`${
                            parseFloat(percentage) >= data.minimumGoal 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            parseFloat(percentage) >= data.minimumGoal
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => markPresent(subject.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Present
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() => markAbsent(subject.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Absent
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}