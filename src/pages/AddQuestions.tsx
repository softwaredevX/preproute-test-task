import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTestStore } from "../store/testStore";
import {
  Trash2,
  Plus,
  Edit2,
  Clock,
  FileText,
  Award,
  Bold,
  Italic,
  Underline,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Image as ImageIcon,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import EditTestModal from "../components/EditTestModal";
import { bulkCreateQuestions } from "../services/api";

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(z.object({ value: z.string().min(1, "Option cannot be empty") }))
    .min(2, "At least 2 options required")
    .max(6),
  correctOptionIndex: z.number().min(0, "Select the correct option"),
  solution: z.string().optional(),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  subTopic: z.string().optional(),
});

type QuestionForm = z.infer<typeof questionSchema>;

const AddQuestions = () => {
  const navigate = useNavigate();
  const { details, questions: storeQuestions, setQuestions } = useTestStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<any[]>(storeQuestions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const isMaxQuestionsReached = !editingQuestionId && !!details?.total_questions && localQuestions.length >= details.total_questions;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      options: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
      correctOptionIndex: -1,
      solution: "",
      difficulty: "",
      topic: "",
      subTopic: "",
    },
  });

  const { fields, remove, append } = useFieldArray({ control, name: "options" });
  const correctOptionIndex = watch("correctOptionIndex");

  const onSubmitQuestion = handleSubmit((data) => {
    if (data.correctOptionIndex < 0) {
      return;
    }
    
    if (editingQuestionId) {
      const updated = localQuestions.map(q => 
        q.id === editingQuestionId 
          ? {
              ...q,
              text: data.text,
              options: data.options.map((o) => o.value),
              correctOptionIndex: data.correctOptionIndex,
              solution: data.solution || "",
              difficulty: data.difficulty || "",
              topic: data.topic || "",
              subTopic: data.subTopic || "",
            }
          : q
      );
      setLocalQuestions(updated);
      setQuestions(updated);
      setEditingQuestionId(null);
    } else {
      const newQ = {
        id: Math.random().toString(36).substr(2, 9),
        text: data.text,
        options: data.options.map((o) => o.value),
        correctOptionIndex: data.correctOptionIndex,
        solution: data.solution || "",
        difficulty: data.difficulty || "",
        topic: data.topic || "",
        subTopic: data.subTopic || "",
      };

      const updated = [...localQuestions, newQ];
      setLocalQuestions(updated);
      setQuestions(updated);
    }

    reset({
      text: "",
      options: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
      correctOptionIndex: -1,
      solution: "",
      difficulty: "",
      topic: "",
      subTopic: "",
    });
    setSaveError("");
  });

  const handleEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    reset({
      text: q.text,
      options: q.options.map((opt: string) => ({ value: opt })),
      correctOptionIndex: q.correctOptionIndex,
      solution: q.solution || "",
      difficulty: q.difficulty || "",
      topic: q.topic || "",
      subTopic: q.subTopic || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    reset({
      text: "",
      options: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
      correctOptionIndex: -1,
      solution: "",
      difficulty: "",
      topic: "",
      subTopic: "",
    });
  };

  const removeLocalQuestion = (id: string) => {
    const updated = localQuestions.filter((q) => q.id !== id);
    setLocalQuestions(updated);
    setQuestions(updated);
  };

  const mapDifficulty = (diff?: string) => {
    if (!diff) return "medium";
    const lower = diff.toLowerCase();
    if (lower === "difficult" || lower === "hard") return "hard";
    if (lower === "easy") return "easy";
    return "medium";
  };

  const handleSaveAndContinue = async () => {
    if (localQuestions.length === 0) {
      setSaveError("Please add at least 1 question before continuing.");
      return;
    }
    const testId = useTestStore.getState().testId;
    if (!testId) {
      setSaveError("Test ID not found. Please go back and recreate the test.");
      return;
    }
    try {
      setIsSaving(true);
      setSaveError("");
      const payload = {
        questions: localQuestions.map((q) => {
          const qObj: any = {
            type: "mcq",
            question: q.text,
            option1: q.options[0] || "",
            option2: q.options[1] || "",
            option3: q.options[2] || "",
            option4: q.options[3] || "",
            correct_option: "option" + (q.correctOptionIndex + 1),
            explanation: q.solution || "",
            difficulty: mapDifficulty(q.difficulty || details?.difficulty),
            subject: details?.subject || "",
            test_id: testId,
          };
          if (q.topic) qObj.topic = q.topic;
          if (q.subTopic) qObj.sub_topic = q.subTopic;
          return qObj;
        }),
      };
      const res = await bulkCreateQuestions(payload);
      if (res.data.status === "success") {
        setQuestions(localQuestions);
        navigate("/preview-publish");
      } else {
        setSaveError(res.data.message || "Failed to save questions.");
      }
    } catch (error: any) {
      console.error("Failed to save questions:", error);
      setSaveError(error.response?.data?.message || "Failed to save questions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const diffLabel = details?.difficulty
    ? details.difficulty.charAt(0).toUpperCase() + details.difficulty.slice(1)
    : "—";

  const diffColor =
    details?.difficulty === "easy"
      ? "bg-[#36C4A6]"
      : details?.difficulty === "difficult"
        ? "bg-red-500"
        : "bg-yellow-500";

  return (
    <div className="p-10 pb-16 max-w-[1100px] font-sans min-h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div className="text-[13px] text-gray-500 font-semibold flex items-center gap-1.5">
          Test Creation <span className="text-gray-300">/</span> Create Test{" "}
          <span className="text-gray-300">/</span>{" "}
          <span className="text-gray-800 capitalize">{details?.type || "Chapter Wise"}</span>
        </div>
        <button
          onClick={handleSaveAndContinue}
          disabled={isSaving}
          className="px-10 py-3 text-sm font-bold text-white bg-[#6582FF] rounded-lg shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save & Preview"}
        </button>
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
            {details?.type || "Chapter Wise"}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📚</span> {details?.name || "Test Name"}
          </h3>
          <span className={"px-3 py-1 " + diffColor + " text-white text-[11px] font-bold rounded-full flex items-center gap-1"}>
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
            {diffLabel}
          </span>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-4 text-[13px]">
            <div className="flex">
              <span className="w-24 text-gray-400 font-medium">Subject</span>
              <span className="font-bold text-gray-700">: {details?.subjectName || details?.subject || "—"}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-gray-400 font-medium">Topic</span>
              <span className="font-bold text-gray-700 flex gap-2 items-center flex-wrap">
                :{" "}
                {(details?.topicNames || details?.topics || []).length > 0
                  ? (details?.topicNames || details?.topics || []).map((t, i) => (
                    <span key={i} className="px-3 py-1 border border-yellow-300 text-yellow-600 rounded-full text-[11px] font-bold bg-yellow-50 ml-1">
                      {t}
                    </span>
                  ))
                  : <span className="ml-1 text-gray-400">—</span>}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-gray-400 font-medium">Sub Topic</span>
              <span className="font-bold text-gray-700 flex gap-2 items-center flex-wrap">
                :{" "}
                {(details?.subTopicNames || details?.sub_topics || []).length > 0
                  ? (details?.subTopicNames || details?.sub_topics || []).map((st, i) => (
                    <span key={i} className="px-3 py-1 border border-yellow-300 text-yellow-600 rounded-full text-[11px] font-bold bg-yellow-50 ml-1">
                      {st}
                    </span>
                  ))
                  : <span className="ml-1 text-gray-400">—</span>}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[13px] text-gray-400 font-bold border border-gray-100 rounded-xl px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} /> {details?.total_time || "—"} Min
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
              <FileText size={16} /> {details?.total_questions || "—"} Q's
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
              <Award size={16} /> {details?.total_marks || "—"} Marks
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex-1">
        {isMaxQuestionsReached ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center shadow-sm">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">All Questions Added</h3>
            <p className="text-[13px] font-medium text-gray-600 mb-6">
              You have added all {details.total_questions} questions for this test. You can review them below or proceed.
            </p>
            <button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className="px-8 py-3 text-sm font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSaving ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            {editingQuestionId ? "Edit Question" : `Question ${localQuestions.length + 1}`}
            {!editingQuestionId && (
              <span className="text-gray-400 font-normal">/{details?.total_questions || "?"}</span>
            )}
          </h3>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => append({ value: "" })}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:text-gray-900"
            >
              <Plus size={14} /> Add Option
            </button>
          </div>
        </div>

        <form onSubmit={onSubmitQuestion} className="space-y-8">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center gap-1 border-b border-gray-200 px-4 py-2.5 text-gray-400">
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Bold size={16} /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><Italic size={16} /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><Underline size={16} /></button>
              <div className="w-px h-5 bg-gray-200 mx-2" />
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><Link2 size={16} /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><AlignLeft size={16} /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><AlignCenter size={16} /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><AlignRight size={16} /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><List size={16} /></button>
              <div className="w-px h-5 bg-gray-200 mx-2" />
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><ImageIcon size={16} /></button>
            </div>
            <div className="relative">
              <textarea
                {...register("text")}
                rows={5}
                className="w-full p-5 focus:outline-none resize-y text-[13px] font-medium text-gray-700 placeholder-gray-400 min-h-[120px]"
                placeholder="Type the question here..."
              />
            </div>
          </div>
          {errors.text && <p className="-mt-6 text-xs text-red-500">{errors.text.message}</p>}

          <div>
            <h4 className="text-[13px] font-bold text-gray-800 mb-4">
              Options <span className="text-gray-400 font-normal text-xs">(click the circle to mark correct answer)</span>
            </h4>
            {errors.correctOptionIndex && (
              <p className="mb-2 text-xs text-red-500">Please select the correct option</p>
            )}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => setValue("correctOptionIndex", index)}
                    className={
                      "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors " +
                      (correctOptionIndex === index
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 hover:border-blue-400")
                    }
                  >
                    {correctOptionIndex === index && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      {...register(`options.${index}.value` as any)}
                      className="block w-full rounded-xl border border-gray-200 px-5 py-3.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] font-medium bg-white shadow-sm"
                      placeholder={"Option " + (index + 1)}
                    />
                    {fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-gray-800 mb-4">Add Solution <span className="text-gray-400 font-normal">(optional)</span></h4>
            <textarea
              {...register("solution")}
              rows={3}
              className="block w-full rounded-xl border border-gray-200 px-5 py-4 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[13px] font-medium bg-white shadow-sm"
              placeholder="Type the explanation here..."
            />
          </div>

          <div className="pt-2">
            <h4 className="text-[13px] font-bold text-gray-800 mb-6">Question settings <span className="text-gray-400 font-normal">(optional)</span></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Level of Difficulty</label>
                <div className="relative">
                  <select
                    {...register("difficulty")}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:border-blue-500 sm:text-sm bg-white font-medium"
                  >
                    <option value="">Select</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="difficult">Difficult</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Topic</label>
                <div className="relative">
                  <select
                    {...register("topic")}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:border-blue-500 sm:text-sm bg-white font-medium"
                  >
                    <option value="">Select</option>
                    {(details?.topicNames || []).map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Sub-topic</label>
                <div className="relative">
                  <select
                    {...register("subTopic")}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:border-blue-500 sm:text-sm bg-white font-medium"
                  >
                    <option value="">Select</option>
                    {(details?.subTopicNames || []).map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 pb-8 border-t border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate("/create-test")}
              className="px-7 py-3 text-sm font-bold text-white bg-[#FF7575] rounded-xl hover:bg-[#FF5C5C] transition-colors shadow-sm"
            >
              Exit Test Creation
            </button>
            <div className="flex gap-4">
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-8 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-12 py-3 text-sm font-bold text-white bg-[#6384F6] rounded-xl hover:bg-[#4E71E6] transition-colors shadow-sm"
              >
                {editingQuestionId ? "Update Question" : "Next"}
              </button>
            </div>
          </div>
        </form>
          </>
        )}
      </div>

      {localQuestions.length > 0 && (
        <div className="mt-4 mb-8">
          <h3 className="text-[14px] font-bold text-gray-800 mb-4">
            Added Questions ({localQuestions.length})
          </h3>
          <div className="space-y-3">
            {localQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-blue-50 text-[#6384F6] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 mb-2">{q.text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-gray-500 mb-2">
                    {q.options.map((opt: string, oi: number) => (
                      <div
                        key={oi}
                        className={`px-3 py-1.5 rounded-lg border ${oi === q.correctOptionIndex
                            ? "border-green-300 bg-green-50 text-green-700 font-bold"
                            : "border-gray-100 bg-gray-50"
                          }`}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold text-green-600">
                    <CheckCircle2 size={12} className="inline mr-1" />
                    Correct: Option {q.correctOptionIndex + 1} — {q.options[q.correctOptionIndex]}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(q)}
                    className="text-gray-300 hover:text-blue-500 transition-colors"
                    title="Edit question"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLocalQuestion(q.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {saveError && (
            <div className="mt-4 bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-lg border border-red-200">
              {saveError}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className="px-12 py-3 text-sm font-bold text-white bg-[#6384F6] rounded-lg hover:bg-[#4E71E6] transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save & Continue to Preview"}
            </button>
          </div>
        </div>
      )}

      {saveError && localQuestions.length === 0 && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-lg border border-red-200">
          {saveError}
        </div>
      )}

      <EditTestModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};

export default AddQuestions;
