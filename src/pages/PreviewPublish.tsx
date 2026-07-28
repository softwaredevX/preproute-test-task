import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '../store/testStore';
import { Edit2, Clock, FileText, Award, Calendar, ChevronDown, CheckCircle2, ChevronRight } from 'lucide-react';
import EditTestModal from '../components/EditTestModal';
import { publishTest } from '../services/api';

const PreviewPublish = () => {
  const navigate = useNavigate();
  const { details, questions, clearTest } = useTestStore();
  const [publishType, setPublishType] = useState('Publish Now');
  const [liveDuration, setLiveDuration] = useState('Custom Duration');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('12:00 PM');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('09:00 AM');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isScheduleCalendarOpen, setIsScheduleCalendarOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const durations = ['Always Available', '3 Weeks', '1 Week', '1 Month', '2 Weeks', 'Custom Duration'];

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();
  const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

  const [calMonth, setCalMonth] = useState(todayMonth);
  const [calYear, setCalYear] = useState(todayYear);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const timeOptions = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
    '08:00 PM', '09:00 PM', '10:00 PM', '11:59 PM'
  ];

  const isPrevMonthDisabled = calYear < todayYear || (calYear === todayYear && calMonth <= todayMonth);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const parseTimeStringToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isTimeInPast = (selectedDateStr: string, timeStr: string) => {
    if (!selectedDateStr) return false;
    if (selectedDateStr === todayStr) {
      const timeMins = parseTimeStringToMinutes(timeStr);
      return timeMins <= currentMinutes;
    }
    return false;
  };

  const handleSelectDay = (day: number) => {
    const cellDate = new Date(calYear, calMonth, day);
    const todayMidnight = new Date(todayYear, todayMonth, todayDay);
    if (cellDate < todayMidnight) return;

    const formattedMonth = String(calMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    setEndDate(`${calYear}-${formattedMonth}-${formattedDay}`);
    setIsCalendarOpen(false);
  };

  const prevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const testId = useTestStore.getState().testId;
      if (!testId) {
        console.error('No test ID found to publish');
        return;
      }
      const res = await publishTest(testId);
      if (res.data.status === 'success') {
        setPublishSuccess(true);
        setTimeout(() => {
          clearTest();
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to publish test:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const diffLabel = details?.difficulty
    ? details.difficulty.charAt(0).toUpperCase() + details.difficulty.slice(1)
    : '—';

  const diffColor =
    details?.difficulty === 'easy' ? 'bg-[#36C4A6]' :
    details?.difficulty === 'difficult' ? 'bg-red-500' : 'bg-yellow-500';

  if (publishSuccess) {
    return (
      <div className="p-10 max-w-[1100px] font-sans h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Published Successfully!</h2>
          <p className="text-gray-500 text-sm font-medium">
            Your test "{details?.name}" is now live. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-[1100px] font-sans h-full flex flex-col relative">
      <div className="text-[13px] text-gray-500 font-semibold mb-6">Test creation</div>

      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-[17px] font-bold text-gray-900">Test Preview</h2>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 border border-green-300 rounded-full text-xs font-bold">
          <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</div>
          {questions.length} Question{questions.length !== 1 ? 's' : ''} added
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm relative">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-6 right-6 text-blue-500 hover:text-blue-600 p-1 bg-blue-50 rounded-md"
        >
          <Edit2 size={16} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="px-5 py-1.5 bg-[#0A1646] text-white text-[11px] font-bold rounded-full capitalize">
            {details?.type || 'Chapter Wise'}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📚</span> {details?.name || '—'}
          </h3>
          <span className={`px-3 py-1 ${diffColor} text-white text-[11px] font-bold rounded-full flex items-center gap-1`}>
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
            {diffLabel}
          </span>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-4 text-[13px]">
            <div className="flex">
              <span className="w-24 text-gray-400 font-medium">Subject</span>
              <span className="font-bold text-gray-700">: {details?.subjectName || details?.subject || '—'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-gray-400 font-medium">Topic</span>
              <span className="font-bold text-gray-700 flex gap-2 items-center flex-wrap">
                :{' '}
                {(details?.topicNames || details?.topics || []).length > 0
                  ? (details?.topicNames || details?.topics || []).map((t, i) => (
                      <span key={i} className="px-3 py-1 border border-yellow-300 text-yellow-600 rounded-full text-[11px] font-bold bg-yellow-50 ml-1">{t}</span>
                    ))
                  : <span className="ml-1 text-gray-400">—</span>
                }
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-gray-400 font-medium">Sub Topic</span>
              <span className="font-bold text-gray-700 flex gap-2 items-center flex-wrap">
                :{' '}
                {(details?.subTopicNames || details?.sub_topics || []).length > 0
                  ? (details?.subTopicNames || details?.sub_topics || []).map((st, i) => (
                      <span key={i} className="px-3 py-1 border border-yellow-300 text-yellow-600 rounded-full text-[11px] font-bold bg-yellow-50 ml-1">{st}</span>
                    ))
                  : <span className="ml-1 text-gray-400">—</span>
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[13px] text-gray-400 font-bold border border-gray-100 rounded-xl px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2"><Clock size={16} /> {details?.total_time || '—'} Min</div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-6"><FileText size={16} /> {questions.length} Q's</div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-6"><Award size={16} /> {details?.total_marks || '—'} Marks</div>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[15px] font-bold text-gray-900 mb-4">Questions ({questions.length})</h3>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="flex-1 text-[13px] text-gray-800 font-medium truncate">{q.text}</p>
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform ${expandedQuestion === idx ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedQuestion === idx && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <div className="space-y-2 mt-4">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-[13px] font-medium ${
                            oi === q.correctOptionIndex
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                          {oi === q.correctOptionIndex && (
                            <CheckCircle2 size={14} className="ml-auto text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    {q.solution && (
                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <p className="text-xs font-bold text-blue-700 mb-1">Explanation</p>
                        <p className="text-[13px] text-blue-800">{q.solution}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm mb-8 h-12 w-max">
        {['Publish Now', 'Schedule Publish'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPublishType(type)}
            className={`px-8 text-[13px] font-bold rounded-lg transition-colors ${
              publishType === type ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {publishType === 'Schedule Publish' && (
        <div className="mb-8">
          <h3 className="text-[15px] font-bold text-gray-900 mb-4">Select Date and Time</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl relative">
            <div className="relative">
              <div
                onClick={() => setIsScheduleCalendarOpen(!isScheduleCalendarOpen)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-[13px] font-medium bg-white shadow-sm cursor-pointer flex items-center justify-between"
              >
                <span className={scheduleDate ? 'text-gray-800 font-semibold' : 'text-gray-400'}>
                  {scheduleDate || 'Select Date'}
                </span>
                <Calendar size={18} className="text-gray-400" />
              </div>

              {isScheduleCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-[280px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      disabled={isPrevMonthDisabled}
                      className={`p-1 rounded-lg text-xs font-bold transition-colors ${
                        isPrevMonthDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      &lt;
                    </button>
                    <span className="text-xs font-bold text-gray-800">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-xs font-bold"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                      const day = i + 1;
                      const cellDate = new Date(calYear, calMonth, day);
                      const todayMidnight = new Date(todayYear, todayMonth, todayDay);
                      const isPast = cellDate < todayMidnight;
                      const formattedMonth = String(calMonth + 1).padStart(2, '0');
                      const formattedDay = String(day).padStart(2, '0');
                      const dateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
                      const isSelected = scheduleDate === dateStr;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => {
                            if (isPast) return;
                            setScheduleDate(dateStr);
                            setIsScheduleCalendarOpen(false);
                          }}
                          className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-colors mx-auto flex items-center justify-center ${
                            isPast
                              ? 'text-gray-300 bg-gray-50 opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <select
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="block w-full appearance-none rounded-xl border border-gray-200 px-4 py-3.5 text-gray-700 focus:outline-none focus:border-blue-500 text-[13px] font-medium bg-white shadow-sm cursor-pointer"
              >
                <option value="" disabled>Select Time</option>
                {timeOptions.map((t) => {
                  const isPast = isTimeInPast(scheduleDate, t);
                  return (
                    <option key={t} value={t} disabled={isPast}>
                      {t} {isPast ? '(Passed)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-[15px] font-bold text-gray-900 mb-2">Live Until</h3>
        <p className="text-[13px] font-medium text-gray-500 mb-6">
          Choose how long this test should remain available on the platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 max-w-3xl mb-8">
          {durations.map((duration) => (
            <label key={duration} className="flex items-center cursor-pointer gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${liveDuration === duration ? 'border-blue-500' : 'border-gray-300'}`}>
                {liveDuration === duration && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
              </div>
              <input type="radio" name="liveDuration" value={duration} checked={liveDuration === duration} onChange={(e) => setLiveDuration(e.target.value)} className="hidden" />
              <span className="text-[13px] font-medium text-gray-700">{duration}</span>
            </label>
          ))}
        </div>

        {liveDuration === 'Custom Duration' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl mb-8 relative">
            <div className="relative">
              <div
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-[13px] font-medium bg-white shadow-sm cursor-pointer flex items-center justify-between"
              >
                <span className={endDate ? 'text-gray-800 font-semibold' : 'text-gray-400'}>
                  {endDate || 'Select End Date'}
                </span>
                <Calendar size={18} className="text-gray-400" />
              </div>

              {isCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-[280px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      disabled={isPrevMonthDisabled}
                      className={`p-1 rounded-lg text-xs font-bold transition-colors ${
                        isPrevMonthDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      &lt;
                    </button>
                    <span className="text-xs font-bold text-gray-800">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-xs font-bold"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                      const day = i + 1;
                      const cellDate = new Date(calYear, calMonth, day);
                      const todayMidnight = new Date(todayYear, todayMonth, todayDay);
                      const isPast = cellDate < todayMidnight;
                      const formattedMonth = String(calMonth + 1).padStart(2, '0');
                      const formattedDay = String(day).padStart(2, '0');
                      const dateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
                      const isSelected = endDate === dateStr;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => handleSelectDay(day)}
                          className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-colors mx-auto flex items-center justify-center ${
                            isPast
                              ? 'text-gray-300 bg-gray-50 opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="block w-full appearance-none rounded-xl border border-gray-200 px-4 py-3.5 text-gray-700 focus:outline-none focus:border-blue-500 text-[13px] font-medium bg-white shadow-sm cursor-pointer"
              >
                <option value="" disabled>Select End Time</option>
                {timeOptions.map((t) => {
                  const isPast = isTimeInPast(endDate, t);
                  return (
                    <option key={t} value={t} disabled={isPast}>
                      {t} {isPast ? '(Passed)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-5 pt-8 pb-10 border-t border-gray-100 mt-auto">
        <button
          onClick={() => navigate('/add-questions')}
          className="px-10 py-3 text-sm font-bold text-[#6384F6] bg-[#F5F7FF] rounded-lg hover:bg-[#E8EDFF] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing || questions.length === 0}
          className="px-12 py-3 text-sm font-bold text-white bg-[#6384F6] rounded-lg hover:bg-[#4E71E6] transition-colors disabled:opacity-50"
        >
          {isPublishing ? 'Publishing...' : 'Confirm'}
        </button>
      </div>

      <EditTestModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};

export default PreviewPublish;
