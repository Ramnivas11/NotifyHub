
const notificationService = require("../services/notification.service");
const asyncHandler = require("../utils/asyncHandler");

const createNotification = asyncHandler(async (req, res) => {

    const notification = await notificationService.create(req.body)

    return res.status(201).json({
        success: true,
        data: notification,
    });
});

const getNotifications = asyncHandler(async (req, res) => {

    const notifications = await notificationService.getAll();

    return res.json({
        success: true,
        data: notifications,
    });

});
const getNotificationById = asyncHandler(async (req,res)=>{
    const id=Number(req.params.id)
    const notification = await notificationService.getById(id);
    if(!notification){
        return res.status(404).json({
            success:false,
            Message:"Notification not found"
        })

    }
    return res.status(200).json({
        success:true,
        data:notification,
    })
})

const updateNotificationById =asyncHandler(async (req,res)=>{
    const id=Number(req.params.id);
    const status=req.body.status;
    const notification = await notificationService.updateStatus(id,status)
    return res.status(200).json({
        success:true,
        data:notification
    })
    
})

const deleteNotificationById= asyncHandler(async (req,res)=>{
    const id = Number(req.params.id)
    await notificationService.remove(id);
    return res.status(200).json({
        success:true,
        message:"Notification deleted successfully "
    })
})

module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    updateNotificationById,
    deleteNotificationById
};