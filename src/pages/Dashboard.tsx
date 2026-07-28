import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, Edit, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllTests, getTestById } from '../services/api';
import EditTestModal from '../components/EditTestModal';
import ViewTestModal from '../components/ViewTestModal';

interface TestItem {
  id: string;
  name: string;
  subject: string;
  topics: string[];
  sub_topics: string[];
  status: string;
  type: string;
  difficulty: string;
  total_questions: number;
  total_marks: number;
  total_time: number;
  created_at: string;
}

const PAGE_SIZE = 15;

const Dashboard = () => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'live'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [viewingTestId, setViewingTestId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await getAllTests();
      if (res.data.status === 'success' || res.data.success) {
        setTests(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleView = (test: TestItem) => {
    setViewingTestId(test.id);
    setIsViewModalOpen(true);
  };

  const handleEdit = async (test: TestItem) => {
    try {
      const res = await getTestById(test.id);
      if (res.data.status === 'success' || res.data.success) {
        setEditingTest(res.data.data);
      } else {
        setEditingTest(test);
      }
    } catch {
      setEditingTest(test);
    }
    setIsEditModalOpen(true);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tests.filter((t) => {
      const matchesSearch =
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.topics?.some((tp) => tp.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (s: 'all' | 'draft' | 'live') => {
    setStatusFilter(s);
    setCurrentPage(1);
  };

  const pageButtons = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, safePage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="p-8 space-y-6 bg-[#F6F8FC] min-h-[calc(100vh-88px)] font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Tests</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {filtered.length} of {tests.length} tests
            </p>
          )}
        </div>
        <Link
          to="/create-test"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={18} />
          Create New Test
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, subject or topic..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'draft', 'live'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-xl">
        {loading ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-500 font-medium">Loading tests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {tests.length === 0 ? 'No tests created yet' : 'No tests match your search'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              {tests.length === 0
                ? 'Get started by creating a new test for your students.'
                : 'Try adjusting your search or filter.'}
            </p>
            {tests.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/create-test"
                  className="inline-flex items-center px-6 py-2.5 shadow-sm text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                  New Test
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginated.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div
                          onClick={() => handleView(test)}
                          className="text-sm font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {test.name}
                        </div>
                        {test.topics?.length > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
                            {test.topics.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {test.subject || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {test.type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {test.total_questions ?? 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          test.status === 'live'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {test.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleView(test)}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(test)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                            title="Edit Test"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {(safePage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{' '}
                of <span className="font-semibold text-gray-700">{filtered.length}</span> results
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageButtons[0] > 1 && (
                  <>
                    <button onClick={() => setCurrentPage(1)} className="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">1</button>
                    {pageButtons[0] > 2 && <span className="px-1 text-gray-400">...</span>}
                  </>
                )}

                {pageButtons.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                      p === safePage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {pageButtons[pageButtons.length - 1] < totalPages && (
                  <>
                    {pageButtons[pageButtons.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
                    <button onClick={() => setCurrentPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">{totalPages}</button>
                  </>
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ViewTestModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingTestId(null);
        }}
        testId={viewingTestId}
        onEdit={(testData) => {
          setEditingTest(testData);
          setIsEditModalOpen(true);
        }}
      />

      <EditTestModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTest(null);
        }}
        testData={editingTest}
        onSaveSuccess={() => {
          fetchTests();
        }}
      />
    </div>
  );
};

export default Dashboard;
