import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config && error.config.url && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = (data: any) => api.post('/auth/login', data);
export const getSubjects = () => api.get('/subjects');
export const getTopicsBySubject = (subjectId: string) => api.get(`/topics/subject/${subjectId}`);
export const getSubTopicsByTopic = (topicId: string) => api.get(`/sub-topics/topic/${topicId}`);
export const getSubTopicsByMultiTopics = (topicIds: string[]) => api.post('/sub-topics/multi-topics', { topicIds });
export const getAllTests = () => api.get('/tests');
export const getTestById = (id: string) => api.get(`/tests/${id}`);
export const createTest = (data: any) => api.post('/tests', data);
export const updateTest = (id: string, data: any) => api.put(`/tests/${id}`, data);
export const publishTest = (id: string) => api.put(`/tests/${id}`, { status: 'live' });
export const bulkCreateQuestions = (data: any) => api.post('/questions/bulk', data);
export const fetchBulkQuestions = (question_ids: string[]) => api.post('/questions/fetchBulk', { question_ids });

export default api;
