import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Edit, Trash2, Calendar } from 'lucide-react';
import { CollegeData } from '../App';

interface SubjectsScreenProps {
  data: CollegeData;
  onDataChange: (data: CollegeData) => void;
}

export function SubjectsScreen({ data, onDataChange }: SubjectsScreenProps) {
  const deleteSubject = (id: string) => {
    onDataChange({
      ...data,
      subjects: data.subjects.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-blue-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Manage Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/90">
            View and manage all your subjects in one place
          </p>
        </CardContent>
      </Card>

      {/* Routine Builder Info Card */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-5 h-5" />
            Routine Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-3">
            Plan your weekly schedule and organize your subjects by day and time.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled
          >
            Coming Soon
          </Button>
        </CardContent>
      </Card>

      {/* Subjects List */}
      {data.subjects.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">No subjects yet</p>
            <p className="text-gray-500">Add subjects from the Home tab</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Your Subjects ({data.subjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.subjects.map((subject) => {
              const percentage = subject.totalClasses > 0 
                ? ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(1) 
                : '0.0';

              return (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-gray-900">{subject.name}</div>
                    <p className="text-gray-600 mt-1">
                      {subject.attendedClasses}/{subject.totalClasses} • {percentage}%
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          parseFloat(percentage) >= data.minimumGoal
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSubject(subject.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Statistics Summary */}
      {data.subjects.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-gray-600">Total Subjects</p>
                <div className="text-gray-900 mt-1">{data.subjects.length}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-gray-600">Total Classes</p>
                <div className="text-gray-900 mt-1">
                  {data.subjects.reduce((sum, s) => sum + s.totalClasses, 0)}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-gray-600">Attended</p>
                <div className="text-gray-900 mt-1">
                  {data.subjects.reduce((sum, s) => sum + s.attendedClasses, 0)}
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <p className="text-gray-600">Target Goal</p>
                <div className="text-gray-900 mt-1">{data.minimumGoal}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
