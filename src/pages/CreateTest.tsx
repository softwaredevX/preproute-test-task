import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTestStore } from "../store/testStore";
import { ChevronDown, ChevronsUpDown, Check } from "lucide-react";
import { getSubjects, getTopicsBySubject, getSubTopicsByMultiTopics, createTest } from "../services/api";

const testDetailsSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  name: z.string().min(1, "Test name is required"),
  duration: z.string().min(1, "Duration is required"),
  difficulty: z.enum(["Easy", "Medium", "Difficult"]),
  wrongAnswer: z.coerce.number(),
  unattempted: z.coerce.number(),
  correctAnswer: z.coerce.number(),
  noOfQuestions: z.string().min(1, "Number of questions is required"),
  totalMarks: z.string().optional(),
});

type TestDetailsForm = z.infer<typeof testDetailsSchema>;

const CreateTest = () => {
  const navigate = useNavigate();
  const { setDetails, setTestId } = useTestStore();
  const [testType, setTestType] = useState("chapterwise");

  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [topicsList, setTopicsList] = useState<any[]>([]);
  const [subTopicsList, setSubTopicsList] = useState<any[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubTopicIds, setSelectedSubTopicIds] = useState<string[]>([]);
  const [topicError, setTopicError] = useState("");
  const [subTopicError, setSubTopicError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [apiError, setApiError] = useState("");

  const extractErrorMessage = (error: any) => {
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
      return error.response.data.errors.map((e: any) => e.msg).join(". ");
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return "Failed to save test. Please try again.";
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TestDetailsForm>({
    resolver: zodResolver(testDetailsSchema),
    defaultValues: {
      subject: "",
      name: "",
      difficulty: "Easy",
      wrongAnswer: -1,
      unattempted: 0,
      correctAnswer: 5,
      duration: "",
      noOfQuestions: "",
      totalMarks: "",
    },
  });

  const difficulty = watch("difficulty");
  const selectedSubject = watch("subject");
  const correctAnswer = watch("correctAnswer");
  const noOfQuestions = watch("noOfQuestions");

  useEffect(() => {
    const q = parseInt(noOfQuestions || "0");
    const c = Number(correctAnswer) || 0;
    if (q > 0 && c > 0) {
      setValue("totalMarks", String(q * c));
    }
  }, [noOfQuestions, correctAnswer, setValue]);

  useEffect(() => {
    getSubjects()
      .then((res) => {
        if (res.data.status === "success") setSubjectsList(res.data.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      setSelectedTopicIds([]);
      setSelectedSubTopicIds([]);
      setSubTopicsList([]);
      getTopicsBySubject(selectedSubject)
        .then((res) => {
          if (res.data.status === "success") setTopicsList(res.data.data);
        })
        .catch(console.error);
    } else {
      setTopicsList([]);
      setSelectedTopicIds([]);
      setSelectedSubTopicIds([]);
      setSubTopicsList([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTopicIds.length > 0) {
      setSelectedSubTopicIds([]);
      getSubTopicsByMultiTopics(selectedTopicIds)
        .then((res) => {
          if (res.data.status === "success") setSubTopicsList(res.data.data);
        })
        .catch(console.error);
    } else {
      setSubTopicsList([]);
      setSelectedSubTopicIds([]);
    }
  }, [selectedTopicIds]);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setTopicError("");
  };

  const toggleSubTopic = (id: string) => {
    setSelectedSubTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setSubTopicError("");
  };

  const validateSelections = () => {
    let valid = true;
    if (selectedTopicIds.length === 0) {
      setTopicError("At least one topic is required");
      valid = false;
    }
    if (selectedSubTopicIds.length === 0) {
      setSubTopicError("At least one sub-topic is required");
      valid = false;
    }
    return valid;
  };

  const buildPayload = (data: TestDetailsForm, status: string) => {
    const subjectObj = subjectsList.find((s) => s.id === data.subject);
    const topicObjs = topicsList.filter((t) => selectedTopicIds.includes(t.id));
    const subTopicObjs = subTopicsList.filter((st) =>
      selectedSubTopicIds.includes(st.id)
    );
    return {
      name: data.name,
      type: testType,
      subject: data.subject,
      subjectName: subjectObj?.name || "",
      topics: selectedTopicIds,
      topicNames: topicObjs.map((t) => t.name),
      sub_topics: selectedSubTopicIds,
      subTopicNames: subTopicObjs.map((st) => st.name),
      correct_marks: Number(data.correctAnswer),
      wrong_marks: Number(data.wrongAnswer),
      unattempt_marks: Number(data.unattempted),
      difficulty: data.difficulty.toLowerCase() === 'difficult' ? 'hard' : data.difficulty.toLowerCase(),
      total_time: parseInt(data.duration),
      total_marks: parseInt(data.totalMarks || "0") || parseInt(data.noOfQuestions) * Number(data.correctAnswer),
      total_questions: parseInt(data.noOfQuestions),
      status,
    };
  };

  const handleSaveAsDraft = handleSubmit(async (data) => {
    if (!validateSelections()) return;
    try {
      setIsSavingDraft(true);
      setApiError("");
      const payload = buildPayload(data, "draft");
      const res = await createTest(payload);
      if (res.data.status === "success" || res.data.success) {
        setTestId(res.data.data.id);
        setDetails(payload as any);
        navigate("/dashboard");
      } else {
        setApiError(res.data.message || "Failed to save draft");
      }
    } catch (error: any) {
      console.error("Failed to save draft:", error);
      setApiError(extractErrorMessage(error));
    } finally {
      setIsSavingDraft(false);
    }
  });

  const onSubmit = async (data: TestDetailsForm) => {
    if (!validateSelections()) return;
    try {
      setIsSubmitting(true);
      setApiError("");
      const payload = buildPayload(data, "draft");
      const res = await createTest(payload);
      if (res.data.status === "success" || res.data.success) {
        setTestId(res.data.data.id);
        setDetails(payload as any);
        navigate("/add-questions");
      } else {
        setApiError(res.data.message || "Failed to create test");
      }
    } catch (error: any) {
      console.error("Failed to create test:", error);
      setApiError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const MultiSelectDropdown = ({
    items,
    selected,
    onToggle,
    error,
    emptyMsg,
    placeholder = "Choose from Drop-down"
  }: {
    items: any[];
    selected: string[];
    onToggle: (id: string) => void;
    error: string;
    emptyMsg: string;
    placeholder?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedText = selected.length === 0
      ? placeholder
      : selected.length === 1
        ? items.find((i: any) => i.id === selected[0])?.name || placeholder
        : `${selected.length} selected`;

    return (
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={
            "w-full cursor-pointer rounded-lg border flex items-center justify-between " +
            (error ? "border-red-400" : "border-gray-300") +
            " px-4 py-3.5 text-gray-700 bg-white sm:text-sm transition-colors"
          }
        >
          <span className={selected.length === 0 ? "text-gray-400" : "text-gray-900 font-medium truncate pr-4"}>
            {selectedText}
          </span>
          <ChevronDown size={18} className={"text-gray-500 transition-transform flex-shrink-0 " + (isOpen ? "rotate-180" : "")} />
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto py-1">
            {items.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">{emptyMsg}</div>
            ) : (
              items.map((item) => (
                <label
                  key={item.id}
                  onClick={(e) => { e.preventDefault(); onToggle(item.id); }}
                  className="flex items-center gap-3 cursor-pointer py-2.5 px-4 hover:bg-gray-50 select-none"
                >
                  <div
                    className={
                      "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors " +
                      (selected.includes(item.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 bg-white")
                    }
                  >
                    {selected.includes(item.id) && (
                      <Check size={10} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-[13px] text-gray-700 font-medium">{item.name}</span>
                </label>
              ))
            )}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1000px] font-sans h-full">
      <div className="mb-8">
        <div className="text-[13px] text-gray-500 mb-6 font-semibold flex items-center gap-1.5">
          Test Creation <span className="text-gray-300">/</span> Create Test{" "}
          <span className="text-gray-300">/</span>{" "}
          <span className="text-gray-800 capitalize">{testType}</span>
        </div>

        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm mb-10 h-12">
          {["chapterwise", "pyq", "mock test"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTestType(type)}
              className={
                "px-8 py-2 text-[14px] font-bold rounded-lg transition-colors capitalize " +
                (testType === type
                  ? "bg-[#F4F6FF] text-blue-600"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50")
              }
            >
              {type}
            </button>
          ))}
        </div>

        {apiError && (
          <div className="mb-8 bg-red-50 text-red-600 font-semibold p-4 rounded-xl border border-red-200 text-xs flex items-center justify-between shadow-sm">
            <span>{apiError}</span>
            <button type="button" onClick={() => setApiError("")} className="text-red-400 hover:text-red-600 font-bold ml-4 text-base">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Subject</label>
              <div className="relative">
                <select
                  {...register("subject")}
                  className={
                    "block w-full appearance-none rounded-lg border " +
                    (errors.subject ? "border-red-400" : "border-gray-300") +
                    " px-4 py-3.5 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                  }
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
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Name of Test</label>
              <input
                type="text"
                {...register("name")}
                placeholder="Enter name of Test"
                className={
                  "block w-full rounded-lg border " +
                  (errors.name ? "border-red-400" : "border-gray-300") +
                  " px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                }
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Topics</label>
              {!selectedSubject ? (
                <div className="rounded-lg border border-gray-200 px-4 py-3.5 text-gray-400 text-sm bg-gray-50">
                  Select a subject first
                </div>
              ) : (
                <MultiSelectDropdown
                  items={topicsList}
                  selected={selectedTopicIds}
                  onToggle={toggleTopic}
                  error={topicError}
                  emptyMsg="Loading topics..."
                  placeholder="Choose from Drop-down"
                />
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Sub Topics</label>
              {selectedTopicIds.length === 0 ? (
                <div className="rounded-lg border border-gray-200 px-4 py-3.5 text-gray-400 text-sm bg-gray-50">
                  Select topics first
                </div>
              ) : (
                <MultiSelectDropdown
                  items={subTopicsList}
                  selected={selectedSubTopicIds}
                  onToggle={toggleSubTopic}
                  error={subTopicError}
                  emptyMsg="Loading sub-topics..."
                  placeholder="Choose from Drop-down"
                />
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Duration (Minutes)</label>
              <input
                type="text"
                {...register("duration")}
                placeholder="Enter the time"
                className={
                  "block w-full rounded-lg border " +
                  (errors.duration ? "border-red-400" : "border-gray-300") +
                  " px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                }
              />
              {errors.duration && (
                <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-4">Test Difficulty Level</label>
              <div className="flex items-center gap-10 mt-3.5">
                {["Easy", "Medium", "Difficult"].map((level) => (
                  <label key={level} className="flex items-center cursor-pointer gap-2.5">
                    <div
                      className={
                        "w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center " +
                        (difficulty === level ? "border-blue-500" : "border-gray-400")
                      }
                    >
                      {difficulty === level && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <input
                      type="radio"
                      value={level}
                      {...register("difficulty")}
                      className="hidden"
                    />
                    <span className="text-[14px] font-bold text-gray-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

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
                  {...register("noOfQuestions")}
                  placeholder="Ex: 50"
                  className={
                    "block w-full rounded-lg border " +
                    (errors.noOfQuestions ? "border-red-400" : "border-gray-300") +
                    " px-4 py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white font-medium"
                  }
                />
                {errors.noOfQuestions && (
                  <p className="mt-1 text-xs text-red-500">{errors.noOfQuestions.message}</p>
                )}
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[13px] font-bold text-gray-300 mb-2">Total Marks (auto)</label>
                <input
                  type="text"
                  {...register("totalMarks")}
                  placeholder="Auto-calculated"
                  className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-500 placeholder-gray-300 focus:outline-none sm:text-sm bg-gray-50 cursor-not-allowed font-medium"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 pb-10">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-10 py-3 text-sm font-bold text-[#6384F6] bg-[#F5F7FF] rounded-lg hover:bg-[#E8EDFF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isSavingDraft || isSubmitting}
              className="px-10 py-3 text-sm font-bold text-[#6384F6] bg-[#F5F7FF] rounded-lg hover:bg-[#E8EDFF] transition-colors disabled:opacity-50"
            >
              {isSavingDraft ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              className="px-12 py-3 text-sm font-bold text-white bg-[#6384F6] rounded-lg hover:bg-[#4E71E6] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTest;
