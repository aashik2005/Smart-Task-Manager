const {
    createTaskService,
    getAllTasksService,
    updateTaskService,
    deleteTaskService
} = require("../services/taskService");

const createTask = async (req, res) => {

    try {

        const task = await createTaskService(req.body);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getAllTasks = async (req, res) => {

    try {

        const tasks = await getAllTasksService();

        res.status(200).json({
            success: true,
            data: tasks
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



const updateTask = async (req, res) => {

    try {

        const updatedTask = await updateTaskService(
            req.params.id,
            req.body
        );

        if (!updatedTask) {

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });

        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const deleteTask = async (req, res) => {

    try {

        const deletedTask = await deleteTaskService(req.params.id);

        if (!deletedTask) {

            return res.status(404).json({
                success: false,
                message: "Task not found"
            });

        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask
};