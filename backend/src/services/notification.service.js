const prisma = require("../lib/prisma");

const create = async (data) => {

    return prisma.notification.create({
        data,
    });

};

const getAll = async () => {

    return prisma.notification.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

};
const getById = async(id)=>{
    return prisma.notification.findUnique(({
        where:{
            id
        }
    }))
}

const updateStatus = async(id,status)=>{
    return prisma.notification.update({
        where:{
            id,
        },
        data:{
            status,
        },
    })
}

const remove=async(id)=>{
    return prisma.notification.delete({
        where:{
            id,
        }
    })
}

module.exports = {
    create,
    getAll,
    getById,
    updateStatus,
    remove,
};