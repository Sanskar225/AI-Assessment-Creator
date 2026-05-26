import axios from 'axios';
import type { Assignment, AssignmentFormData } from '../types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export async function fetchAssignments(): Promise<Assignment[]> {
  const { data } = await api.get('/api/assignments');
  return data.data;
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  const { data } = await api.get(`/api/assignments/${id}`);
  return data.data;
}

export async function createAssignment(formData: AssignmentFormData): Promise<{ assignmentId: string; jobId: string }> {
  const fd = new FormData();
  fd.append('title', formData.title);
  fd.append('subject', formData.subject);
  fd.append('className', formData.className);
  if (formData.dueDate) fd.append('dueDate', formData.dueDate);
  if (formData.additionalInfo) fd.append('additionalInfo', formData.additionalInfo);
  fd.append('questionTypes', JSON.stringify(
    formData.questionTypes.map(({ type, questions, marks }) => ({ type, questions, marks }))
  ));
  if (formData.file) fd.append('file', formData.file);

  const { data } = await api.post('/api/assignments', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/api/assignments/${id}`);
}

export function getPDFUrl(id: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}/pdf`;
}
