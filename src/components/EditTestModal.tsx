import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import { useTestStore } from '../store/testStore';
import { getSubjects, getTopicsBySubject, getSubTopicsByMultiTopics, updateTest } from '../services/api';

const editSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  name: z.string().min(1, 'Test name is required'),
  duration: z.string().min(1, 'Duration is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Difficult']),
  status: z.enum(['live', 'unpublished', 'scheduled', 'expired', 'draft']),
  wrongAnswer: z.coerce.number(),
  unattempted: z.coerce.number(),
  correctAnswer: z.coerce.number(),
  noOfQuestions: z.string().min(1, 'Number of questions is required'),
  totalMarks: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testData?: any;
  onSaveSuccess?: () => void;
}

const EditTestModal: React.FC<EditTestModalProps> = ({ isOpen, onClose, testData, onSaveSuccess }) => {
  const { details, setDetails, testId } = useTestStore();

  const activeData = testData || details;
  const activeId = testData?.id || testId;

  const [testType, setTestType] = useState(activeData?.type || 'chapterwise');
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [topicsList, setTopicsList] = useState<any[]>([]);
  const [subTopicsList, setSubTopicsList] = useState<any[]>([]);

  // Multi-select state – pre-fill from existing activeData
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(activeData?.topics || []);
  const [selectedSubTopicIds, setSelectedSubTopicIds] = useState<string[]>(activeData?.sub_topics || []);
  const [topicError, setTopicError] = useState('');
  const [subTopicError, setSubTopicError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      subject: activeData?.subject || '',
      name: activeData?.name || '',
      difficulty: (activeData?.difficulty
        ? activeData.difficulty.charAt(0).toUpperCase() + activeData.difficulty.slice(1)
        : 'Easy') as 'Easy' | 'Medium' | 'Difficult',
      status: (activeData?.status?.toLowerCase() || 'draft') as 'live' | 'unpublished' | 'scheduled' | 'expired' | 'draft',
      wrongAnswer: activeData?.wrong_marks ?? -1,
      unattempted: activeData?.unattempt_marks ?? 0,
      correctAnswer: activeData?.correct_marks ?? 5,
      duration: activeData?.total_time ? String(activeData.total_time) : '',
      noOfQuestions: activeData?.total_questions ? String(activeData.total_questions) : '',
      totalMarks: activeData?.total_marks ? String(activeData.total_marks) : '',
    },
  });

  // Re-sync form state when modal opens or testData changes
  useEffect(() => {
    if (!isOpen) return;
    const target = testData || details;
    if (target) {
      setTestType(target.type || 'chapterwise');
      setSelectedTopicIds(target.topics || []);
      setSelectedSubTopicIds(target.sub_topics || []);
      reset({
        subject: target.subject || '',
        name: target.name || '',
        difficulty: (target.difficulty
          ? target.difficulty.charAt(0).toUpperCase() + target.difficulty.slice(1)
          : 'Easy') as 'Easy' | 'Medium' | 'Difficult',
        status: (target.status?.toLowerCase() || 'draft') as 'live' | 'unpublished' | 'scheduled' | 'expired' | 'draft',
        wrongAnswer: target.wrong_marks ?? -1,
        unattempted: target.unattempt_marks ?? 0,
        correctAnswer: target.correct_marks ?? 5,
        duration: target.total_time ? String(target.total_time) : '',
        noOfQuestions: target.total_questions ? String(target.total_questions) : '',
        totalMarks: target.total_marks ? String(target.total_marks) : '',
      });
    }
  }, [isOpen, testData, details, reset]);

  const difficulty = watch('difficulty');
  const selectedSubject = watch('subject');
  const correctAnswer = watch('correctAnswer');
  const noOfQuestions = watch('noOfQuestions');

  // Auto-calculate total marks
  useEffect(() => {
    const q = parseInt(noOfQuestions || '0');
    const c = Number(correctAnswer) || 0;
    if (q > 0 && c > 0) setValue('totalMarks', String(q * c));
  }, [noOfQuestions, correctAnswer, setValue]);

  // Fetch subjects once on open & auto-select matching subject
  useEffect(() => {
    if (!isOpen) return;
    const target = testData || details;
    getSubjects()
      .then((res) => {
        if (res.data.status === 'success') {
          const list = res.data.data;
          setSubjectsList(list);
          if (target?.subject) {
            const match = list.find(
              (s: any) => s.id === target.subject || s.name === target.subject
            );
            if (match) {
              setValue('subject', match.id);
            }
          }
        }
      })
      .catch(console.error);
  }, [isOpen, testData, details, setValue]);

  // Fetch topics when subject changes & auto-select matching topics
  useEffect(() => {
    if (!selectedSubject) return;
    const target = testData || details;
    getTopicsBySubject(selectedSubject)
      .then((res) => {
        if (res.data.status === 'success') {
          const list = res.data.data;
          setTopicsList(list);
          if (target?.topics && target.topics.length > 0) {
            const matchedIds = list
              .filter((t: any) =>
                target.topics.some((saved: string) => saved === t.id || saved === t.name)
              )
              .map((t: any) => t.id);
            if (matchedIds.length > 0) {
              setSelectedTopicIds(matchedIds);
            }
          }
        }
      })
      .catch(console.error);
  }, [selectedSubject, testData, details]);

  // Fetch sub-topics when selected topics change & auto-select matching sub-topics
  useEffect(() => {
    if (selectedTopicIds.length === 0) {
      setSubTopicsList([]);
      setSelectedSubTopicIds([]);
      return;
    }
    const target = testData || details;
    getSubTopicsByMultiTopics(selectedTopicIds)
      .then((res) => {
        if (res.data.status === 'success') {
          const list = res.data.data;
          setSubTopicsList(list);
          if (target?.sub_topics && target.sub_topics.length > 0) {
            const matchedIds = list
              .filter((st: any) =>
                target.sub_topics.some((saved: string) => saved === st.id || saved === st.name)
              )
              .map((st: any) => st.id);
            if (matchedIds.length > 0) {
              setSelectedSubTopicIds(matchedIds);
            }
          }
        }
      })
      .catch(console.error);
  }, [selectedTopicIds, testData, details]);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setTopicError('');
  };

  const toggleSubTopic = (id: string) => {
    setSelectedSubTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setSubTopicError('');
  };

  const validateSelections = () => {
    let valid = true;
    if (selectedTopicIds.length === 0) {
      setTopicError('At least one topic is required');
      valid = false;
    }
    if (selectedSubTopicIds.length === 0) {
      setSubTopicError('At least one sub-topic is required');
      valid = false;
    }
    return valid;
  };

  const onSubmit = async (data: EditForm) => {
    if (!validateSelections()) return;
    try {
      setIsSaving(true);
      const subjectObj = subjectsList.find((s) => s.id === data.subject);
      const topicObjs = topicsList.filter((t) => selectedTopicIds.includes(t.id));
      const subTopicObjs = subTopicsList.filter((st) => selectedSubTopicIds.includes(st.id));

      const payload = {
        name: data.name,
        type: testType,
        subject: data.subject,
        subjectName: subjectObj?.name || details?.subjectName || '',
        topics: selectedTopicIds,
        topicNames: topicObjs.map((t) => t.name),
        sub_topics: selectedSubTopicIds,
        subTopicNames: subTopicObjs.map((st) => st.name),
        correct_marks: Number(data.correctAnswer),
        wrong_marks: Number(data.wrongAnswer),
        unattempt_marks: Number(data.unattempted),
        difficulty: data.difficulty.toLowerCase() === 'difficult' ? 'hard' : data.difficulty.toLowerCase(),
        total_time: parseInt(data.duration),
        total_marks: parseInt(data.totalMarks || '0') || parseInt(data.noOfQuestions) * Number(data.correctAnswer),
        total_questions: parseInt(data.noOfQuestions),
        status: data.status,
      };

      const targetId = activeId || testId;
      if (targetId) {
        await updateTest(targetId, payload);
      }

      setDetails(payload as any);
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update test:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const NumberInput = ({ label, name, registerRef }: any) => (
    <div className="w-[140px]">
      <label className="block text-[13px] font-bold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          {...registerRef(name)}
          className="block w-full rounded-lg border border-gray-300 pl-4 pr-10 py-3 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white font-semibold appearance-none"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col items-center justify-center pr-3">
          <ChevronsUpDown size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  );

  const CheckboxList = ({
    items,
    selected,
    onToggle,
    error,
    emptyMsg,
  }: {
    items: any[];
    selected: string[];
    onToggle: (id: string) => void;
    error: string;
    emptyMsg: string;
  }) => (
    <>
      {items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 px-4 py-3.5 text-gray-400 text-sm bg-gray-50">
          {emptyMsg}
        </div>
      ) : (
        <div className={`rounded-lg border ${error ? 'border-red-400' : 'border-gray-300'} p-3 bg-white max-h-[150px] overflow-y-auto space-y-1`}>
          {items.map((item) => (
            <label
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-3 cursor-pointer py-1.5 hover:bg-gray-50 px-1 rounded select-none"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.includes(item.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                }`}
              >
                {selected.includes(item.id) && (
                  <Check size={10} className="text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-[13px] text-gray-700 font-medium">{item.name}</span>
            </label>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <p className="mt-1 text-xs text-blue-600 font-medium">{selected.length} selected</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1000px] max-h-[90vh] overflow-y-auto font-sans relative">
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <h2 className="text-[17px] font-bold text-gray-800">Edit Test Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {/* Test Type Toggle */}
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm mb-10 h-12">
            {['chapterwise', 'pyq', 'mock test'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTestType(type)}
                className={`px-8 text-[13px] font-bold rounded-lg transition-colors capitalize ${
                  testType === type ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
              {/* Subject — fetched from API */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Subject</label>
                <div className="relative">
                  <select
                    {...register('subject')}
                    className={`block w-full appearance-none rounded-lg border ${errors.subject ? 'border-red-400' : 'border-gray-300'} px-4 py-3.5 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white`}
                  >
                    <option value="" disabled hidden>Choose from Drop-down</option>
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <ChevronDown size={18} />
                  </div>
                </div>
                {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
              </div>

              {/* Test Name — pre-filled from details */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Name of Test</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Enter name of Test"
                  className={`block w-full rounded-lg border ${errors.name ? 'border-red-400' : 'border-gray-300'} px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white font-medium`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Topics — cascaded from selected subject */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Topics</label>
                {!selectedSubject ? (
                  <div className="rounded-lg border border-gray-200 px-4 py-3.5 text-gray-400 text-sm bg-gray-50">Select a subject first</div>
                ) : (
                  <CheckboxList
                    items={topicsList}
                    selected={selectedTopicIds}
                    onToggle={toggleTopic}
                    error={topicError}
                    emptyMsg="Loading topics..."
                  />
                )}
              </div>

              {/* Sub-topics — cascaded from selected topics */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Sub Topics</label>
                {selectedTopicIds.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 px-4 py-3.5 text-gray-400 text-sm bg-gray-50">Select topics first</div>
                ) : (
                  <CheckboxList
                    items={subTopicsList}
                    selected={selectedSubTopicIds}
                    onToggle={toggleSubTopic}
                    error={subTopicError}
                    emptyMsg="Loading sub-topics..."
                  />
                )}
              </div>

              {/* Duration — pre-filled from details */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Duration (Minutes)</label>
                <input
                  type="text"
                  {...register('duration')}
                  placeholder="Enter the time"
                  className={`block w-full rounded-lg border ${errors.duration ? 'border-red-400' : 'border-gray-300'} px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white`}
                />
                {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>}
              </div>

              {/* Test Status */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Test Status</label>
                <div className="relative">
                  <select
                    {...register('status')}
                    className={`block w-full appearance-none rounded-lg border ${errors.status ? 'border-red-400' : 'border-gray-300'} px-4 py-3.5 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white capitalize font-medium`}
                  >
                    {['draft', 'live', 'unpublished', 'scheduled', 'expired'].map((st) => (
                      <option key={st} value={st} className="capitalize">
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <ChevronDown size={18} />
                  </div>
                </div>
                {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
              </div>

              {/* Difficulty — pre-filled from details */}
              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-gray-700 mb-4">Test Difficulty Level</label>
                <div className="flex items-center gap-10 mt-3.5">
                  {['Easy', 'Medium', 'Difficult'].map((level) => (
                    <label key={level} className="flex items-center cursor-pointer gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${difficulty === level ? 'border-blue-500' : 'border-gray-400'}`}>
                        {difficulty === level && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                      </div>
                      <input type="radio" value={level} {...register('difficulty')} className="hidden" />
                      <span className="text-[14px] font-bold text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Marking Scheme — pre-filled from details */}
            <div className="pt-2">
              <label className="block text-[13px] font-bold text-gray-700 mb-4">Marking Scheme:</label>
              <div className="flex flex-wrap items-end gap-10">
                <NumberInput label="Wrong Answer" name="wrongAnswer" registerRef={register} />
                <NumberInput label="Unattempted" name="unattempted" registerRef={register} />
                <NumberInput label="Correct Answer" name="correctAnswer" registerRef={register} />

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">No of Questions</label>
                  <input
                    type="text"
                    {...register('noOfQuestions')}
                    placeholder="Ex: 50"
                    className={`block w-full rounded-lg border ${errors.noOfQuestions ? 'border-red-400' : 'border-gray-300'} px-4 py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white font-medium`}
                  />
                  {errors.noOfQuestions && <p className="mt-1 text-xs text-red-500">{errors.noOfQuestions.message}</p>}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[13px] font-bold text-gray-300 mb-2">Total Marks (auto)</label>
                  <input
                    type="text"
                    {...register('totalMarks')}
                    placeholder="Auto-calculated"
                    className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-500 placeholder-gray-300 focus:outline-none sm:text-sm bg-gray-50 cursor-not-allowed font-medium"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-5 pt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-3 text-sm font-bold text-[#6384F6] bg-[#F5F7FF] rounded-lg hover:bg-[#E8EDFF] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-12 py-3 text-sm font-bold text-white bg-[#6384F6] rounded-lg hover:bg-[#4E71E6] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTestModal;
