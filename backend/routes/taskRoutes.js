const express=require('express');
const {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask
} = require("../controllers/taskController.js");

const router=express.Router()

router.get('/',getAllTasks);
router.post('/',createTask);
router.put('/',updateTask);
router.delete('/',deleteTask);

module.exports = router;