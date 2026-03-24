import { useAuth } from '@/context/AuthContext';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import TaskCard from './components/TaskCard';

const MyTasks = () => {
    const { user } = useAuth();
    const { tasks, loading, handleStatusUpdate } = useStaffTasks(user?.email);

    if (loading) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Đang tải nhiệm vụ...</div>;

    return (
        <div className="tasks-container">
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>Nhiệm vụ của tôi</h1>
                <p style={{ color: 'var(--staff-text-muted)' }}>Quản lý và thực hiện các dịch vụ đã được phân công.</p>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {tasks.length === 0 ? (
                    <p style={{ color: 'var(--staff-text-muted)' }}>Chưa có nhiệm vụ nào được phân công.</p>
                ) : (
                    tasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            onStatusUpdate={handleStatusUpdate} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default MyTasks;
