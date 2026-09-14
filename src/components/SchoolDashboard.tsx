import { useState } from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, TrendingUp, CheckCircle2, XCircle, Plus, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { Week } from '../App';

interface SchoolDashboardProps {
  weeks: Week[];
  currentWeek: number;
  onWeeksChange: (weeks: Week[]) => void;
  onCurrentWeekChange: (week: number) => void;
  onAddNewWeek: () => void;
  previousAttended: number;
  previousTotal: number;
  onPreviousAttendedChange: (value: number) => void;
  onPreviousTotalChange: (value: number) => void;

  saturdayEnabled: boolean;
  onSaturdayEnabledChange: (val: boolean) => void;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
];

export function SchoolDashboard({ 
  weeks, 
  currentWeek, 
  onWeeksChange, 
  onCurrentWeekChange,
  onAddNewWeek,
  previousAttended,
  previousTotal,
  onPreviousAttendedChange,
  onPreviousTotalChange,
  saturdayEnabled,
  onSaturdayEnabledChange,
}: SchoolDashboardProps) {
  
  const [activeView, setActiveView] = useState<'this-week' | 'history'>('this-week');
  const visibleDays = saturdayEnabled
    ? DAYS
    : DAYS.filter((day) => day.key !== 'saturday');

  const getCurrentWeekData = () => {
    return weeks.find(w => w.weekNumber === currentWeek) || weeks[0];
  };

  // Calculate current session stats
  const currentDaysPresent = weeks.reduce(
    (sum, week) =>
      sum +
      Object.entries(week.attendance).filter(([day, status]) => {
        if (!saturdayEnabled && day === 'saturday') return false;
        return status === 'present' || status === true;
      }).length,
    0
  );

  // Filter out holidays from totals
  const currentDays = weeks.reduce(
    (sum, week) =>
      sum +
      Object.entries(week.attendance).filter(([day, status]) => {
        if (!saturdayEnabled && day === 'saturday') return false;
        return status !== 'holiday';
      }).length,
    0
  );

  const totalDays = currentDays + previousTotal;
  const daysPresent = currentDaysPresent + previousAttended;

  const attendancePercentage =
    totalDays > 0 ? ((daysPresent / totalDays) * 100).toFixed(1) : "0.0";

  // Current week stats
  const currentWeekData = getCurrentWeekData();
  const currentWeekDays = visibleDays.filter(
    ({ key }) => currentWeekData.attendance[key] !== 'holiday'
  ).length;
  const currentWeekPresent = visibleDays.filter(
    ({ key }) => currentWeekData.attendance[key] === 'present' || currentWeekData.attendance[key] === true
  ).length;
  const currentWeekPercentage =
    currentWeekDays > 0 ? ((currentWeekPresent / currentWeekDays) * 100).toFixed(1) : '0.0';

  const toggleAttendance = (weekNum: number, day: string) => {
    const updatedWeeks = weeks.map(week => {
      if (week.weekNumber === weekNum) {
        const currentStatus = week.attendance[day];
        let nextStatus: string;

        if (currentStatus === "present" || currentStatus === true) nextStatus = "absent";
        else if (currentStatus === "absent" || currentStatus === false) nextStatus = "holiday";
        else nextStatus = "present";

        return {
          ...week,
          attendance: {
            ...week.attendance,
            [day]: nextStatus,
          },
        };
      }
      return week;
    });
    onWeeksChange(updatedWeeks);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Saturday Toggle */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Label htmlFor="saturday-toggle" className="text-gray-700 cursor-pointer">
          Include Saturday
        </Label>
        <Switch
          id="saturday-toggle"
          checked={saturdayEnabled}
          onCheckedChange={(val) => onSaturdayEnabledChange(val)}
        />
      </div>
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
            <span>Days Attended</span>
            <span>{daysPresent}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total Days</span>
            <span>{totalDays}</span>
          </div>
          <div className="pt-3 border-t border-white/20">
            <div className="flex justify-between items-center mb-2">
              <span>Attendance %</span>
              <span>{attendancePercentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, parseFloat(attendancePercentage))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mid-Session Join Section */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <UserPlus className="w-5 h-5" />
            Joined Mid-Session?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            If you joined after the session started, enter your previous attendance to get an accurate percentage.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="previousAttended" className="text-gray-700">
                Previous Attended
              </Label>
              <Input
                id="previousAttended"
                type="number"
                min="0"
                placeholder="0"
                value={previousAttended || ''}
                onChange={(e) => onPreviousAttendedChange(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousTotal" className="text-gray-700">
                Previous Total
              </Label>
              <Input
                id="previousTotal"
                type="number"
                min="0"
                placeholder="0"
                value={previousTotal || ''}
                onChange={(e) => onPreviousTotalChange(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {(previousAttended > 0 || previousTotal > 0) && (
            <div className="bg-white rounded-lg p-3 border border-purple-300">
              <div className="text-gray-700 mb-2">Calculation Breakdown:</div>
              <div className="text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Previous:</span>
                  <span>{previousAttended} / {previousTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span>{currentDaysPresent} / {currentTotalDays}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="text-gray-900">Combined:</span>
                  <span className="text-gray-900">{daysPresent} / {totalDays}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="history">Previous Weeks</TabsTrigger>
        </TabsList>

        <TabsContent value="this-week" className="space-y-4 mt-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCurrentWeekChange(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <div className="text-gray-900">Week {currentWeek}</div>
              <p className="text-gray-600">{currentWeekPresent}/{currentWeekDays} days</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentWeek < weeks.length) {
                  onCurrentWeekChange(currentWeek + 1);
                }
              }}
              disabled={currentWeek >= weeks.length}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Weekly Progress */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">This Week Progress</span>
                <span className="text-gray-900">{currentWeekPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentWeekPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Calendar */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {visibleDays.map(({ key, label }) => {
                  const status = currentWeekData.attendance[key];
                  const isPresent = status === 'present' || status === true;
                  const isHoliday = status === 'holiday';

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isPresent
                          ? 'border-green-400 bg-green-50'
                          : isHoliday
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                      onClick={() => toggleAttendance(currentWeek, key)}
                    >
                      <div className="text-center">
                        <div className="text-gray-700 mb-2 font-medium">{label}</div>
                        {isPresent ? (
                          <CheckCircle2 className="w-6 h-6 mx-auto text-green-600" />
                        ) : isHoliday ? (
                          <div className="text-center text-yellow-600 font-semibold my-1 text-sm">Holiday</div>
                        ) : (
                          <XCircle className="w-6 h-6 mx-auto text-red-600" />
                        )}
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {isHoliday ? 'No Class' : isPresent ? 'Present' : 'Absent'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Add New Week Button */}
          {currentWeek === weeks.length && (
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              onClick={onAddNewWeek}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Week {weeks.length + 1}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {weeks.length === 1 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No previous weeks yet</p>
                <p className="text-gray-500">Complete this week to see history</p>
              </CardContent>
            </Card>
          ) : (
            weeks.slice().reverse().map((week) => {
              const weekDays = visibleDays.filter(({ key }) => week.attendance[key] !== 'holiday').length;
              const weekPresent = visibleDays.filter(
                ({ key }) => week.attendance[key] === 'present' || week.attendance[key] === true
              ).length;
              const weekPercentage = weekDays > 0 ? ((weekPresent / weekDays) * 100).toFixed(1) : '0.0';

              return (
                <Card
                  key={week.weekNumber}
                  className={`border-0 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                    week.weekNumber === currentWeek ? 'ring-2 ring-purple-400' : ''
                  }`}
                  onClick={() => onCurrentWeekChange(week.weekNumber)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-gray-900">Week {week.weekNumber}</CardTitle>
                      <div className="text-right">
                        <div className={`${parseFloat(weekPercentage) >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                          {weekPercentage}%
                        </div>
                        <p className="text-gray-600">{weekPresent}/{weekDays} days</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {visibleDays.map(({ key }) => {
                        const status = week.attendance[key];
                        const isPresent = status === 'present' || status === true;
                        const isHoliday = status === 'holiday';
                        return (
                          <div
                            key={key}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium ${
                              isPresent
                                ? 'bg-green-500'
                                : isHoliday
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                            title={`${key}: ${status || 'absent'}`}
                          >
                            {isPresent ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : isHoliday ? (
                              'H'
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}