interface CreateTask {
  user_id: string;
  title: string;
  task_date_time: Date;
  task_description?: string;
  notes?: string;
}

interface CreateTaskForSync {
  user_id: string;
  task_id: string;
  title: string;
  task_date_time: Date;
  task_description?: string | null;
  notes?: string | null;
  is_completed?: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UpdateTask {
  title?: string;
  task_description?: string | null;
  task_date_time?: Date;
  notes?: string | null;
  is_completed?: boolean;
  is_synced?: boolean;
  is_marked_for_deletion?: boolean;
  updated_at?: Date;
}

interface SyncedTask {
  task_id: string;
  action: ACTION;
}

enum ACTION {
  created = "created",
  updated = "updated",
  deleted = "deleted",
  skipped = "skipped",
}

interface SyncedTasks {
  syncedTasks: SyncedTask[];
}

export {
  CreateTask,
  UpdateTask,
  CreateTaskForSync,
  SyncedTask,
  SyncedTasks,
  ACTION,
};
