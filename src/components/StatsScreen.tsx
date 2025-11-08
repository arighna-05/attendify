import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, Calendar, TrendingUp, Target, Award, UserPlus } from 'lucide-react';
import { Week, CollegeData } from '../App';

interface StatsScreenProps {
  userType: 'school' | 'college';
  schoolWeeks?: Week[];
  collegeData?: CollegeData;
  ecaCount: number;
  previousAttended?: number;
  previousTotal?: number;
}

export function StatsScreen({ 
  userType, 
  schoolWeeks, 
  collegeData, 
  ecaCount,
  previousAttended = 0,
  previousTotal = 0,
}: StatsScreenProps) {
  // Calculate stats
  let totalClasses = 0;
  let attendedClasses = 0;
  let absentClasses = 0;
  let attendancePercentage = '0.0';
  let totalWeeks = 0;

  if (userType === 'school' && schoolWeeks) {
    totalWeeks = schoolWeeks.length;
    const currentTotalDays = schoolWeeks.reduce((sum, week) => sum + Object.keys(week.attendance).length, 0);
    const currentDaysPresent = schoolWeeks.reduce(
      (sum, week) => sum + Object.values(week.attendance).filter(Boolean).length,
      0
    );
    
    totalClasses = currentTotalDays + previousTotal;
    attendedClasses = currentDaysPresent + previousAttended;
    absentClasses = totalClasses - attendedClasses;
    attendancePercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : '0.0';
  } else if (userType === 'college' && collegeData) {
    totalClasses = collegeData.subjects.reduce((sum, subject) => sum + subject.totalClasses, 0);
    attendedClasses = collegeData.subjects.reduce((sum, subject) => sum + subject.attendedClasses, 0);
    absentClasses = totalClasses - attendedClasses;
    attendancePercentage = totalClasses > 0 ? (((attendedClasses + ecaCount) / totalClasses) * 100).toFixed(1) : '0.0';
  }

  const stats = [
    {
      title: userType === 'school' ? 'Total Weeks' : 'Total Subjects',
      value: userType === 'school' ? totalWeeks : (collegeData?.subjects.length || 0),
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: userType === 'school' ? 'Days Attended' : 'Classes Attended',
      value: userType === 'school' ? attendedClasses : attendedClasses + ecaCount,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: userType === 'school' ? 'Days Missed' : 'Classes Missed',
      value: absentClasses,
      icon: BarChart3,
      color: 'from-red-500 to-pink-500',
    },
    {
      title: 'Attendance Rate',
      value: `${attendancePercentage}%`,
      icon: Target,
      color: 'from-purple-500 to-violet-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`border-0 shadow-md bg-gradient-to-br ${stat.color} text-white`}
          >
            <CardContent className="pt-6">
              <stat.icon className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-gray-100">{stat.title}</div>
              <div className="mt-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overall Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userType === 'school' && (previousAttended > 0 || previousTotal > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-500" />
                  Previous Attendance
                </span>
                <span className="text-purple-600">{previousAttended} / {previousTotal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${previousTotal > 0 ? (previousAttended / previousTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>{userType === 'school' ? 'Current Session' : 'Regular Attendance'}</span>
              <span>{userType === 'school' ? attendedClasses - previousAttended : attendedClasses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all"
                style={{ 
                  width: `${
                    userType === 'school' 
                      ? (totalClasses - previousTotal > 0 ? ((attendedClasses - previousAttended) / (totalClasses - previousTotal)) * 100 : 0)
                      : (totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0)
                  }%` 
                }}
              />
            </div>
          </div>

          {userType === 'college' && ecaCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  ECA Bonus
                </span>
                <span className="text-amber-600">+{ecaCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${totalClasses > 0 ? (ecaCount / totalClasses) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Missed</span>
              <span>{absentClasses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-pink-500 h-full rounded-full transition-all"
                style={{ width: `${totalClasses > 0 ? (absentClasses / totalClasses) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Final Attendance</span>
                <span className={`${parseFloat(attendancePercentage) >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                  {attendancePercentage}%
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, parseFloat(attendancePercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {userType === 'college' && collegeData && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700">Your Goal</span>
                <span className="text-gray-900">{collegeData.minimumGoal}%</span>
              </div>
              {parseFloat(attendancePercentage) >= collegeData.minimumGoal ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700">🎉 Goal Achieved!</p>
                  <p className="text-gray-600 mt-1">
                    You're {(parseFloat(attendancePercentage) - collegeData.minimumGoal).toFixed(1)}% above your goal
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-amber-700">Keep going!</p>
                  <p className="text-gray-600 mt-1">
                    You need {(collegeData.minimumGoal - parseFloat(attendancePercentage)).toFixed(1)}% more to reach your goal
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Breakdown for School */}
      {userType === 'school' && schoolWeeks && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schoolWeeks.slice().reverse().map((week) => {
              const weekDays = Object.keys(week.attendance).length;
              const weekPresent = Object.values(week.attendance).filter(Boolean).length;
              const weekPercentage = weekDays > 0 ? ((weekPresent / weekDays) * 100).toFixed(1) : '0.0';

              return (
                <div key={week.weekNumber} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-900">Week {week.weekNumber}</span>
                    <span className={`${parseFloat(weekPercentage) >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                      {weekPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{weekPresent}/{weekDays} days</span>
                    <div className="w-32 bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          parseFloat(weekPercentage) >= 75 ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${weekPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Subject Breakdown for College */}
      {userType === 'college' && collegeData && collegeData.subjects.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Subject-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {collegeData.subjects.map((subject) => {
              const percentage = subject.totalClasses > 0 
                ? ((subject.attendedClasses / subject.totalClasses) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={subject.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-900">{subject.name}</span>
                    <span className={`${parseFloat(percentage) >= collegeData.minimumGoal ? 'text-green-600' : 'text-red-600'}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{subject.attendedClasses}/{subject.totalClasses} classes</span>
                    <div className="w-32 bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          parseFloat(percentage) >= collegeData.minimumGoal ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
