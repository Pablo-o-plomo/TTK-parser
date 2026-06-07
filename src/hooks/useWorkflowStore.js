import { useCallback, useEffect, useState } from 'react'
import { APPROVAL_STATUS, makeTaskId, REQUIRED_MATERIALS } from '../domain/workflow.js'

const STORAGE_KEY = 'ttk_network_workflow_v1'

const initialState = {
  tasks: [],
  comments: [],
  manualLinks: [],
  uploads: [],
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useWorkflowStore() {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    setState(readState())
  }, [])

  const persist = useCallback(updater => {
    setState(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeState(next)
      return next
    })
  }, [])

  const createTask = useCallback(payload => {
    const now = new Date().toISOString()
    const task = {
      id: makeTaskId(),
      status: APPROVAL_STATUS.WAITING_SUBMISSION,
      createdAt: now,
      updatedAt: now,
      requiredMaterials: REQUIRED_MATERIALS.map(item => item.id),
      history: [{ at: now, status: APPROVAL_STATUS.WAITING_SUBMISSION, comment: 'Задание создано бренд-шефом' }],
      submission: null,
      ...payload,
    }
    persist(current => ({ ...current, tasks: [task, ...current.tasks] }))
    return task
  }, [persist])

  const submitTask = useCallback((taskId, submission) => {
    const now = new Date().toISOString()
    persist(current => ({
      ...current,
      tasks: current.tasks.map(task => task.id === taskId ? {
        ...task,
        status: APPROVAL_STATUS.SUBMITTED,
        updatedAt: now,
        submission: { ...submission, submittedAt: now },
        history: [...(task.history || []), { at: now, status: APPROVAL_STATUS.SUBMITTED, comment: 'Ресторан отправил материалы' }],
      } : task),
    }))
  }, [persist])

  const updateTaskStatus = useCallback((taskId, status, comment = '') => {
    const now = new Date().toISOString()
    persist(current => ({
      ...current,
      tasks: current.tasks.map(task => task.id === taskId ? {
        ...task,
        status,
        updatedAt: now,
        reviewComment: comment || task.reviewComment,
        history: [...(task.history || []), { at: now, status, comment }],
      } : task),
    }))
  }, [persist])

  const addManualLink = useCallback(link => {
    persist(current => ({
      ...current,
      manualLinks: [
        ...current.manualLinks.filter(item => !(item.restaurant === link.restaurant && item.dishId === link.dishId)),
        link,
      ],
    }))
  }, [persist])

  const addUpload = useCallback(upload => {
    const now = new Date().toISOString()
    const record = {
      id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      status: upload.mode === 'table' ? 'needs_mapping' : 'uploaded',
      ...upload,
    }
    persist(current => ({ ...current, uploads: [record, ...(current.uploads || [])] }))
    return record
  }, [persist])

  return {
    ...state,
    createTask,
    submitTask,
    updateTaskStatus,
    addManualLink,
    addUpload,
  }
}
