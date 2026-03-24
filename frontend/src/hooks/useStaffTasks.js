import { useState, useEffect, useCallback } from 'react';
import { getStaffBookings, updateBookingStatus } from '@/services/api';
import toast from 'react-hot-toast';

export const useStaffTasks = (email) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (!email) return;
        setLoading(true);
        try {
            const data = await getStaffBookings(email);
            setTasks(data || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("Không thể tải danh sách nhiệm vụ");
        } finally {
            setLoading(false);
        }
    }, [email]);

    const handleStatusUpdate = async (taskId, nextStatus, proofImage = null) => {
        try {
            const updated = await updateBookingStatus(taskId, nextStatus, proofImage);
            toast.success(`Đã cập nhật trạng thái: ${nextStatus}`);
            fetchTasks(); 
            return updated;
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
            throw error;
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, fetchTasks, handleStatusUpdate };
};
