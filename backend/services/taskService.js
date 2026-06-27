const Task = require("../models/Tasks");

const createTaskService = async (taskData) => {

    const task = await Task.create(taskData);

    return task;

};

const getAllTasksService = async () => {

    const tasks = await Task.find();

    return tasks;

};


const updateTaskService = async (id, updatedData) => {

    const updatedTask = await Task.findByIdAndUpdate(
        id,
        updatedData,
        {
            new: true,
            runValidators: true
        }
    );

    return updatedTask;

};


const deleteTaskService = async (id) => {

    const deletedTask = await Task.findByIdAndDelete(id);

    return deletedTask;

};

module.exports = {
    createTaskService,
    getAllTasksService,
    updateTaskService,
    deleteTaskService
};