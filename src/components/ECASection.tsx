import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Award, TrendingUp, ArrowRight } from 'lucide-react';
import { CollegeData } from '../App';

interface ECASectionProps {
  ecaCount: number;
  onEcaChange: (count: number) => void;
  userType: 'school' | 'college';
  collegeData?: CollegeData;
}

export function ECASection({
  ecaCount,
  onEcaChange,
  collegeData,
}: ECASectionProps) {
  const handleEcaChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    onEcaChange(Math.max(0, numValue));
  };

  // Calculate stats for college only
  let totalClasses = 0;
  let attendedClasses = 0;
  let currentPercentage = '0.0';
  let newPercentage = '0.0';

  if (collegeData) {
    totalClasses = collegeData.subjects.reduce((sum, subject) => sum + subject.totalClasses, 0);
    attendedClasses = collegeData.subjects.reduce((sum, subject) => sum + subject.attendedClasses, 0);
    currentPercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : '0.0';
    newPercentage = totalClasses > 0 ? (((attendedClasses + ecaCount) / totalClasses) * 100).toFixed(1) : '0.0';
  }

  const improvement = (parseFloat(newPercentage) - parseFloat(currentPercentage)).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-amber-400 to-orange-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Extra Curricular Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/90">
            Boost your attendance with extra activities and events
          </p>
        </CardContent>
      </Card>

      {/* ECA Input Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Add ECA Count</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ecaCount">Number of ECA Attendances</Label>
            <Input
              id="ecaCount"
              type="number"
              min="0"
              placeholder="Enter extra attendance count"
              value={ecaCount}
              onChange={(e) => handleEcaChange(e.target.value)}
              className="text-lg"
            />
            <p className="text-gray-600">
              Add bonus attendance from sports, events, or other activities
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 mb-2">Calculation Formula:</p>
            <div className="bg-white rounded p-3 text-center">
              <span className="text-gray-900">
                (Attended + ECA) / Total Classes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 items-center">
            {/* Before */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-1">Before</p>
              <div className="text-gray-900">{currentPercentage}%</div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-purple-500" />
            </div>

            {/* After */}
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300">
              <p className="text-gray-600 mb-1">After</p>
              <div className="text-purple-700">{newPercentage}%</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Total Classes</p>
              <div className="text-gray-900 mt-1">{totalClasses}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Attended</p>
              <div className="text-gray-900 mt-1">{attendedClasses}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600">ECA Bonus</p>
              <div className="text-gray-900 mt-1">+{ecaCount}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600">Improvement</p>
              <div className="text-green-600 mt-1">+{improvement}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-md bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-gray-700">
              💡 <span>ECA attendance is added to your overall count but doesn't affect individual subject attendance records.</span>
            </p>
            <p className="text-gray-700">
              ✨ <span>Perfect for sports days, cultural events, seminars, or any bonus attendance!</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
