import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type User = {
  id: string;
  email?: string;
  full_name?: string;
};

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        setError(error.message);
        console.error('Supabase fetch error:', error);
      } else {
        setUsers(data as User[]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) return <div>جارٍ التحميل...</div>;
  if (error) return <div>خطأ في تحميل البيانات: {error}</div>;

  return (
    <div>
      {users.length === 0 ? (
        <p>لا توجد سجلات في جدول users.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.full_name ?? user.email ?? user.id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
