interface CreateTask {
  user_id: string;
  title: string;
  task_date_time: Date;
  task_description?: string;
  notes?: string;
}

interface UpdateTask {
  title?: string;
  task_description?: string;
  task_date_time?: string;
  notes?: string;
  is_completed?: boolean;
  is_synced?: boolean;
  is_marked_for_deletion?: boolean;
}

export { CreateTask, UpdateTask };
