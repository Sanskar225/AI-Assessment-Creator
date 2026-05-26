import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Assignment, JobProgress, AssignmentFormData } from '../../types';
import * as api from '../../utils/api';

interface AssignmentsState {
  items: Assignment[];
  loading: boolean;
  error: string | null;
  currentAssignment: Assignment | null;
  jobProgress: JobProgress | null;
  wsConnected: boolean;
}

const initialState: AssignmentsState = {
  items: [],
  loading: false,
  error: null,
  currentAssignment: null,
  jobProgress: null,
  wsConnected: false,
};

export const loadAssignments = createAsyncThunk(
  'assignments/loadAll',
  async () => api.fetchAssignments()
);

export const loadAssignment = createAsyncThunk(
  'assignments/loadOne',
  async (id: string) => api.fetchAssignment(id)
);

export const submitAssignment = createAsyncThunk(
  'assignments/submit',
  async (formData: AssignmentFormData) => api.createAssignment(formData)
);

export const removeAssignment = createAsyncThunk(
  'assignments/remove',
  async (id: string) => {
    await api.deleteAssignment(id);
    return id;
  }
);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setCurrentAssignment(state, action: PayloadAction<Assignment | null>) {
      state.currentAssignment = action.payload;
    },
    setJobProgress(state, action: PayloadAction<JobProgress>) {
      state.jobProgress = action.payload;
    },
    clearJobProgress(state) {
      state.jobProgress = null;
    },
    setWsConnected(state, action: PayloadAction<boolean>) {
      state.wsConnected = action.payload;
    },
    updateAssignmentInList(state, action: PayloadAction<Assignment>) {
      const idx = state.items.findIndex((a) => a._id === action.payload._id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.unshift(action.payload);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load all
      .addCase(loadAssignments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loadAssignments.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(loadAssignments.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      // Load one
      .addCase(loadAssignment.fulfilled, (state, action) => {
        state.currentAssignment = action.payload;
        const idx = state.items.findIndex((a) => a._id === action.payload._id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      // Remove
      .addCase(removeAssignment.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a._id !== action.payload);
      });
  },
});

export const {
  setCurrentAssignment,
  setJobProgress,
  clearJobProgress,
  setWsConnected,
  updateAssignmentInList,
  clearError,
} = assignmentsSlice.actions;

export default assignmentsSlice.reducer;
