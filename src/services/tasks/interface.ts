interface CreateTask {
  user_id: string;
  title: string;
  task_date_time: Date;
  task_description?: string;
  notes?: string;
}

export { CreateTask };
