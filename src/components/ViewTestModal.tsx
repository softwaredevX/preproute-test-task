import { useEffect, useState } from 'react';
import { X, Clock, FileText, Award, Edit2, CheckCircle2, ChevronRight } from 'lucide-react';
import { getTestById, fetchBulkQuestions } from '../services/api';

interface ViewTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string | null;
  onEdit?: (testData: any) => void;
}

const ViewTestModal: React.FC<ViewTestModalProps> = ({ isOpen, onClose, testId, onEdit }) => {
  const [testData, setTestData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !testId) {
      setTestData(null);
      setQuestions([]);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getTestById(testId);
        if (res.data.status === 'success' || res.data.success) {
          const data = res.data.data;
          setTestData(data);

          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            if (typeof data.questions[0] === 'string') {
              const qRes = await fetchBulkQuestions(data.questions);
              if (qRes.data.status === 'success' || qRes.data.success) {
                setQuestions(qRes.data.data || []);
              }
            } else {
              setQuestions(data.questions);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch test details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, testId]);

  if (!isOpen) return null;

  const diffLabel = testData?.difficulty
    ? testData.difficulty.charAt(0).toUpperCase() + testData.difficulty.slice(1)
    : 'Medium';

  const diffColor =
    testData?.difficulty === 'easy'
      ? 'bg-[#36C4A6]'
      : testData?.difficulty === 'difficult'
      ? 'bg-red-500'
      : 'bg-yellow-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto font-sans relative flex flex-col">
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">Test Details</h2>
            {testData?.status && (
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                  testData.status === 'live'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {testData.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {testData && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(testData);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Edit2 size={14} /> Edit Test
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-500 font-medium">Loading test details...</p>
            </div>
          ) : !testData ? (
            <div className="py-16 text-center text-gray-500 font-medium">
              Failed to load test details.
            </div>
          ) : (
            <>
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1 bg-[#0A1646] text-white text-[11px] font-bold rounded-full capitalize">
                    {testData.type || 'Chapter Wise'}
                  </span>
                  <span className={`px-3 py-1 ${diffColor} text-white text-[11px] font-bold rounded-full flex items-center gap-1`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                    {diffLabel}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span>📚</span> {testData.name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="w-28 text-gray-400 font-medium">Subject</span>
                      <span className="font-bold text-gray-800">: {testData.subject || '—'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-28 text-gray-400 font-medium shrink-0">Topics</span>
                      <div className="font-bold text-gray-800 flex gap-1.5 flex-wrap">
                        :{' '}
                        {testData.topics && testData.topics.length > 0
                          ? testData.topics.map((t: string, i: number) => (
                              <span key={i} className="px-2.5 py-0.5 border border-yellow-300 text-yellow-700 bg-yellow-50 rounded-full text-[11px] font-semibold">
                                {t}
                              </span>
                            ))
                          : <span className="text-gray-400 font-normal">None</span>}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="w-28 text-gray-400 font-medium shrink-0">Sub Topics</span>
                      <div className="font-bold text-gray-800 flex gap-1.5 flex-wrap">
                        :{' '}
                        {testData.sub_topics && testData.sub_topics.length > 0
                          ? testData.sub_topics.map((st: string, i: number) => (
                              <span key={i} className="px-2.5 py-0.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-full text-[11px] font-semibold">
                                {st}
                              </span>
                            ))
                          : <span className="text-gray-400 font-normal">None</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                      <span className="flex items-center gap-2 text-gray-500 font-medium">
                        <Clock size={16} className="text-blue-500" /> Total Duration
                      </span>
                      <span className="font-bold text-gray-900">{testData.total_time ?? '—'} Minutes</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                      <span className="flex items-center gap-2 text-gray-500 font-medium">
                        <FileText size={16} className="text-blue-500" /> Total Questions
                      </span>
                      <span className="font-bold text-gray-900">{testData.total_questions ?? '—'} Questions</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-500 font-medium">
                        <Award size={16} className="text-blue-500" /> Total Marks
                      </span>
                      <span className="font-bold text-gray-900">{testData.total_marks ?? '—'} Marks</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Marking Scheme</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-600">Correct Answer</p>
                    <p className="text-lg font-bold text-green-700 mt-0.5">+{testData.correct_marks ?? 5}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-600">Wrong Answer</p>
                    <p className="text-lg font-bold text-red-700 mt-0.5">{testData.wrong_marks ?? -1}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600">Unattempted</p>
                    <p className="text-lg font-bold text-gray-700 mt-0.5">{testData.unattempt_marks ?? 0}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Test Questions ({questions.length})</span>
                </h4>

                {questions.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs font-medium">
                    No individual questions attached or fetched for this test yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q: any, idx: number) => (
                      <div key={q.id || idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </div>
                          <p className="flex-1 text-[13px] text-gray-800 font-medium truncate">
                            {q.question || q.text}
                          </p>
                          <ChevronRight
                            size={16}
                            className={`text-gray-400 transition-transform ${expandedQuestion === idx ? 'rotate-90' : ''}`}
                          />
                        </button>

                        {expandedQuestion === idx && (
                          <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/50">
                            <div className="space-y-2 mt-4">
                              {[q.option1, q.option2, q.option3, q.option4].filter(Boolean).map((opt: string, oi: number) => {
                                const isCorrect = q.correct_option === `option${oi + 1}` || oi === q.correctOptionIndex;
                                return (
                                  <div
                                    key={oi}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[13px] font-medium ${
                                      isCorrect
                                        ? 'border-green-300 bg-green-50 text-green-700 font-bold'
                                        : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                  >
                                    <span>{String.fromCharCode(65 + oi)}.</span>
                                    <span>{opt}</span>
                                    {isCorrect && (
                                      <CheckCircle2 size={14} className="ml-auto text-green-600" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {q.explanation && (
                              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                                <span className="font-bold block mb-1">Explanation:</span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-8 py-5 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestModal;
