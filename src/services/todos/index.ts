import * as todoDAO from "./dao";
import { Request, Response } from "express";

export async function getTodos(req: Request, res: Response) {
  const todos = await todoDAO.getAllTodos();
  res.json(todos);
}

export async function createTodo(req: Request, res: Response) {
  const { title } = req.body;
  const newTodo = await todoDAO.insertTodo(title);
  res.status(201).json(newTodo);
}
